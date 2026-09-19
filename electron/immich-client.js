class ImmichError extends Error {}

function normalizeBaseUrl(value) {
  let url;
  try { url = new URL(value.trim()); } catch (_) { throw new ImmichError('Enter a valid server URL.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new ImmichError('Server URL must use HTTP or HTTPS.');
  url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/api$/, '');
  return url.toString().replace(/\/$/, '');
}

class ImmichClient {
  constructor(baseUrl, apiKey, { fetchImpl = fetch, logger = null } = {}) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.apiKey = apiKey;
    this.fetch = fetchImpl;
    this.logger = logger;
  }
  async request(endpoint, accept = 'application/json') {
    let response;
    try {
      response = await this.fetch(`${this.baseUrl}/api/${endpoint.replace(/^\/+/, '')}`, {
        headers: { 'X-Api-Key': this.apiKey, Accept: accept }
      });
    } catch (error) {
      this.logger?.warn(`Immich connection failed for ${endpoint}`, error);
      throw new ImmichError(`Could not connect to Immich: ${error.message || error}`);
    }
    if (!response.ok) {
      const detail = (await response.text()).trim();
      this.logger?.warn(`Immich HTTP ${response.status} for ${endpoint}`);
      throw new ImmichError(`Immich returned HTTP ${response.status} for ${endpoint}: ${detail || response.statusText}`);
    }
    return accept === 'image/*' ? Buffer.from(await response.arrayBuffer()) : response.json();
  }
  async listPeople() {
    let payload;
    try { payload = await this.request('people'); }
    catch (error) { if (!String(error.message).includes('HTTP 404')) throw error; payload = await this.request('person'); }
    const items = Array.isArray(payload) ? payload : payload && Array.isArray(payload.people) ? payload.people : null;
    if (!items) throw new ImmichError('Immich returned an unexpected people response.');
    return items.map((p) => ({
      id: String(p.id), name: String(p.name || 'Unnamed person'),
      // Current Immich person responses omit a faceCount field. Their asset
      // count is the useful library count to show for a selected person.
      faceCount: Number(
        p.faceCount ?? p.face_count ?? p.facesCount ?? p.faces_count ??
        p.assetCount ?? p.asset_count ?? p.assets?.length ?? 0
      ) || 0,
      thumbnailPath: p.thumbnailPath || p.thumbnail_path || null
    })).sort((a, b) => a.name.localeCompare(b.name));
  }
  getPersonThumbnail(personId) {
    return this.request(`people/${encodeURIComponent(personId)}/thumbnail`, 'image/*');
  }
}

module.exports = { ImmichClient, ImmichError, normalizeBaseUrl };
