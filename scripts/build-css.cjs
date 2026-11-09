// Build compact styles without changing the editable source files or rule order.
const fs = require('node:fs');
const path = require('node:path');
const CleanCSS = require('clean-css');
const root = path.resolve(__dirname, '..');
for (const [folder, files] of Object.entries({
  homepage: ['styles.css', 'team-coaching.css', 'testimonials.css', 'photos.css'],
  about: ['styles.css'],
})) {
  const css = files.map(file => fs.readFileSync(path.join(root, folder, file), 'utf8')).join('\n');
  const result = new CleanCSS({ level: 1, rebase: false }).minify(css);
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  fs.writeFileSync(path.join(root, folder, 'site.min.css'), result.styles + '\n');
  console.log(`${folder}: ${Buffer.byteLength(css)} -> ${Buffer.byteLength(result.styles)} bytes`);
}
