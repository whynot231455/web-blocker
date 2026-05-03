import { sanitizeUrl, isValidDomain } from './url';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error('Assertion failed: ' + message);
  }
}

console.log('Running URL Normalization Tests...');

// sanitizeUrl tests
assert(sanitizeUrl('https://www.youtube.com/') === 'youtube.com', 'Should remove protocol and www');
assert(sanitizeUrl('http://facebook.com/path?query=1') === 'facebook.com', 'Should remove path and query');
assert(sanitizeUrl('  EXAMPLE.COM  ') === 'example.com', 'Should trim and lowercase');
assert(sanitizeUrl('sub.domain.com') === 'sub.domain.com', 'Should keep subdomains');

// isValidDomain tests
assert(isValidDomain('google.com') === true, 'google.com is valid');
assert(isValidDomain('sub.google.com') === true, 'sub.google.com is valid');
assert(isValidDomain('not-a-domain') === false, 'not-a-domain is invalid');
assert(isValidDomain('http://google.com') === false, 'google.com with protocol is invalid for this function');

console.log('All tests passed!');
