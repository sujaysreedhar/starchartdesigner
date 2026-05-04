import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 650;
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

export function LocationSearch({ poster, onSelectLocation }) {
  const [query, setQuery] = useState(poster.locationName || '');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const abortRef = useRef(null);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    setQuery(poster.locationName || '');
    setHasTyped(false);
  }, [poster.locationName]);

  useEffect(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (!hasTyped) {
      setResults([]);
      setError('');
      setStatus('idle');
      return undefined;
    }

    if (!canSearch) {
      setResults([]);
      setError('');
      setStatus(trimmedQuery.length > 0 ? 'too-short' : 'idle');
      return undefined;
    }

    setStatus('loading');
    setError('');

    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(buildSearchUrl(trimmedQuery), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Location search failed with status ${response.status}`);
        }

        const data = await response.json();
        setResults(data);
        setStatus(data.length ? 'ready' : 'empty');
      } catch (searchError) {
        if (searchError.name === 'AbortError') {
          return;
        }

        setResults([]);
        setError('Location search is unavailable right now.');
        setStatus('error');
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [canSearch, hasTyped, trimmedQuery]);

  const helperText = useMemo(() => {
    if (status === 'loading') {
      return 'Searching locations...';
    }

    if (status === 'too-short') {
      return 'Type at least 3 characters.';
    }

    if (status === 'empty') {
      return 'No matching locations found.';
    }

    if (status === 'error') {
      return error;
    }

    return 'Search by city, landmark, or place name.';
  }, [error, status]);

  const selectResult = (result) => {
    const location = normalizeLocationResult(result);
    setQuery(location.displayName);
    setResults([]);
    setStatus('selected');
    onSelectLocation(location);
  };

  return (
    <section className="locationSearch">
      <label className="field locationSearchField">
        <span>Location search</span>
        <div className="locationInputWrap">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => {
              setHasTyped(true);
              setQuery(event.target.value);
            }}
            placeholder="Search city or place"
            autoComplete="off"
          />
        </div>
      </label>

      <p className={status === 'error' ? 'locationState error' : 'locationState'}>{helperText}</p>

      {results.length > 0 && (
        <div className="locationResults" role="listbox" aria-label="Location search results">
          {results.map((result) => (
            <button
              key={`${result.place_id}-${result.lat}-${result.lon}`}
              type="button"
              className="locationResult"
              onClick={() => selectResult(result)}
            >
              <MapPin size={16} />
              <span>
                <strong>{getPrimaryName(result.display_name)}</strong>
                <small>{getSecondaryName(result)}</small>
              </span>
            </button>
          ))}
        </div>
      )}

      {(poster.locationState || poster.locationCountry) && (
        <div className="selectedLocationMeta">
          {poster.locationState && <span>{poster.locationState}</span>}
          {poster.locationCountry && <span>{poster.locationCountry}</span>}
        </div>
      )}
    </section>
  );
}

function buildSearchUrl(query) {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    limit: '5',
    addressdetails: '1',
  });

  return `${NOMINATIM_SEARCH_URL}?${params.toString()}`;
}

function normalizeLocationResult(result) {
  const address = result.address ?? {};

  return {
    displayName: result.display_name,
    locationName: getPosterLocationName(result),
    latitude: Number(result.lat).toFixed(4),
    longitude: Number(result.lon).toFixed(4),
    locationState: address.state || address.region || address.county || '',
    locationCountry: address.country || '',
    type: result.type || '',
    importance: result.importance ?? '',
  };
}

function getPosterLocationName(result) {
  const address = result.address ?? {};
  const locality = address.city || address.town || address.village || address.municipality || address.county;
  const region = address.state || address.region;
  const country = address.country;

  return [locality, region, country].filter(Boolean).join(', ') || result.display_name;
}

function getPrimaryName(displayName) {
  return displayName.split(',')[0] || displayName;
}

function getSecondaryName(result) {
  const details = [result.type, result.importance ? `importance ${Number(result.importance).toFixed(2)}` : '']
    .filter(Boolean)
    .join(' - ');
  const displayParts = result.display_name.split(',').slice(1, 4).join(',').trim();

  return [displayParts, details].filter(Boolean).join(' - ');
}
