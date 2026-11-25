import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlToPlainText } from '../src/lib/html.js';

test('htmlToPlainText keeps the words, drops the markup and decodes common entities', () => {
  assert.equal(
    htmlToPlainText('<p>안녕하세요&nbsp;&amp; hello</p><style>p { color: red }</style><p>Second &lt;line&gt;</p>'),
    '안녕하세요 & hello\n\nSecond <line>',
  );
  assert.equal(htmlToPlainText('First<br>second<div>third</div>'), 'First\nsecond\nthird');
});

test('htmlToPlainText leaves plain text alone and treats nothing as empty', () => {
  assert.equal(htmlToPlainText('Just words &lt; not an entity'), 'Just words < not an entity');
  assert.equal(htmlToPlainText(''), '');
  assert.equal(htmlToPlainText(null), '');
  assert.equal(htmlToPlainText(undefined), '');
});
