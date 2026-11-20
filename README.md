# Ocean Mind Lab website

Static website for Ocean Mind Lab, published with GitHub Pages at
<https://ocean-mind-lab.github.io/>.

## Structure

```text
index.html                  lab homepage
styles.css                  homepage styles
projects/
  marrbench/                self-contained MarrBench project page
```

Each future project should live in its own lowercase directory under
`projects/`, use relative asset paths, and include its own `index.html`.

## Local preview

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080/> or
<http://localhost:8080/projects/marrbench/>.

## Publishing

Configure GitHub Pages to deploy from the `main` branch and `/(root)`. The
root `.nojekyll` file keeps this repository in static-file mode.
