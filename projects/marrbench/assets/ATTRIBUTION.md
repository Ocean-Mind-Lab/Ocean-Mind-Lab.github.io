# Website asset attribution

This file records the provenance of visual assets shipped with the independent
MarrBench website. Original source terms govern third-party material.

## MarrBench figures

- `og-card.png`: social preview built from the GRP04 input / ground-truth pair below.

## Task-family examples

The family cards use these input / scoring-target pairs:

- EDG06 — low-resolution text restoration
- GRP04 — named part decomposition
- SUR02 — cast-shadow detection
- HID06 — masked background completion
- MOT02 — optical flow
- REC01 — compound restoration
- LAY02 — comic panels and reading order
- SCI01 — clustered nucleus instance segmentation

EDG06, GRP04, SUR02, HID06, MOT02, REC01, and LAY02 use MarrBench-authored
generated data released under CC BY 4.0.

SCI01 derives from BBBC039v1, released under CC0 1.0. Please cite:

> Caicedo et al. (2018), Data-analysis strategies for image-based cell profiling,
> Nature Methods, and the Broad Bioimage Benchmark Collection.

## Qualitative cases

The gallery shows ten tasks: EDG01, GRP04, SUR02, SUR04, HID06, MOT02, REC01 and
SCI07 are MarrBench-generated (synthetic) inputs; LAY01 and SCI10 derive from
the real-data sources below. Model images are display renderings of each
model's re-executed output, produced by `tools/build_cases.py`.

### LAY01 document layout

The transformed page and annotations derive from DocLayNet:

- Source: <https://github.com/DS4SD/DocLayNet>
- Terms: CDLA-Permissive-1.0
- Transformation: the MarrBench LAY01 task maps DocLayNet blocks to the
  benchmark output classes; model images are visualizations of those outputs.

Please preserve DocLayNet attribution when redistributing this example.

### SCI10 PCB defects

The transformed PCB image and annotations derive from VisA:

- Source: <https://registry.opendata.aws/visa/>
- Terms: CC BY 4.0
- Reference: Zou et al., “SPot-the-Difference: Unsupervised Pre-training for
  Anomaly Detection and Segmentation.”
- Transformation: the MarrBench SCI10 task selects and visualizes the supplied
  defect masks; model images overlay submitted defect maps.

## Excluded material

No website asset comes from the twelve MarrBench tasks marked
`metadata_and_checksums_only`. In particular, the site does not redistribute
LSUN Room Layout, SHIQ, ImageNet, DRIVE, GlaS, ISBI 2012 EM, ZInD, VL-CMU-CD,
SBMnet/CDnet, DAVIS, ShanghaiTech Wireframe, or Cell Tracking Challenge images.

For the full data registry, see the benchmark dataset's `THIRD_PARTY.yaml` and
`DATA_LICENSE.md`.
