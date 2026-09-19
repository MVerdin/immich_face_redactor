const test = require('node:test');
const assert = require('node:assert/strict');
const { ImmichClient, ImmichError, normalizeBaseUrl } = require('../electron/immich-client');

test('normalizes an /api URL', () => assert.equal(normalizeBaseUrl('https://photos.example/api/'), 'https://photos.example'));

test('maps wrapped people and sorts by name', async () => {
  const client = new ImmichClient('https://photos.example', 'secret', {
    fetchImpl: async () => new Response(JSON.stringify({ people: [
      { id: '2', name: 'zoe', faceCount: 1 }, { id: '1', name: 'Alice', faceCount: 3 }
    ] }), { status: 200, headers: { 'content-type': 'application/json' } })
  });
  assert.deepEqual(await client.listPeople(), [
    { id: '1', name: 'Alice', faceCount: 3, thumbnailPath: null },
    { id: '2', name: 'zoe', faceCount: 1, thumbnailPath: null }
  ]);
});

test('uses the Immich asset count when faceCount is not returned', async () => {
  const client = new ImmichClient('https://photos.example', 'secret', {
    fetchImpl: async () => new Response(JSON.stringify([
      { id: '1', name: 'Alice', assetCount: 12 }
    ]), { status: 200 })
  });
  assert.equal((await client.listPeople())[0].faceCount, 12);
});

test('falls back to legacy endpoint on 404', async () => {
  const paths = [];
  const client = new ImmichClient('https://photos.example', 'secret', {
    fetchImpl: async (url) => {
      paths.push(url);
      return paths.length === 1 ? new Response('missing', { status: 404 }) : new Response('[]', { status: 200 });
    }
  });
  assert.deepEqual(await client.listPeople(), []);
  assert.equal(paths[1], 'https://photos.example/api/person');
});

test('retrieves a person thumbnail with a safely encoded id', async () => {
  let request;
  const client = new ImmichClient('https://photos.example', 'secret', {
    fetchImpl: async (url, options) => { request = { url, options }; return new Response(new Uint8Array([1, 2]), { status: 200 }); }
  });
  assert.deepEqual(await client.getPersonThumbnail('a/b'), Buffer.from([1, 2]));
  assert.equal(request.url, 'https://photos.example/api/people/a%2Fb/thumbnail');
  assert.equal(request.options.headers['X-Api-Key'], 'secret');
});

test('rejects malformed responses', async () => {
  const client = new ImmichClient('https://photos.example', 'secret', {
    fetchImpl: async () => new Response('{}', { status: 200 })
  });
  await assert.rejects(client.listPeople(), ImmichError);
});
