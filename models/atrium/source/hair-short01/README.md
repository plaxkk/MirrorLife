# CC0 short01 hair study

Source: MakeHuman system asset pack, `hair/short01`, downloaded 2026-09-22.
Official listing: https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html
Archive and downloaded SHA-256 values are in `provenance.json`.

The OBJ, material and binding headers explicitly release these assets as CC0 in
September 2020. See the parent directory's `CC0-1.0.txt`. The original diffuse PNG
is retained unchanged. No MakeHuman application code is included.

`head-anchors.json` contains the 506 base-mesh vertices referenced by the binding
and its axis-scale anchors. It is extracted without coordinate changes from the
same CC0 `base.obj` already used for the resident head, SHA-256
`8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c`.
The keys are original zero-based vertex indices. Binding weights plus scaled
offsets adapt the authored hairstyle to that base before the resident affine fit.

This is now the default hero hair when hero art is enabled. The first rollout
includes a smooth front-perimeter adjustment toward the brow (maximum 0.038m
before inherited rig scaling). It is an incremental art improvement, not full
production-art approval. Set `ATRIUM_AUTHORED_HAIR=0` for the legacy procedural groom.

For isolated studies use `ATRIUM_AUTHORED_HAIR_STUDY=short01`,
`ATRIUM_RESIDENT_IDS=you`, and `ATRIUM_BUILD_ROOT` beneath repository `tmp/`.
Set `ATRIUM_HAIR_FRINGE_STUDY=0` to reproduce the initial unsculpted binding fit.
The groom retains hair-card topology and UVs at both LODs, exports 512px desktop
and 256px mobile maps with glTF MASK cutoff 0.4, and follows HeadPivot.
The runtime treats texture cutout and camera fade independently. Do not enable
alpha-to-coverage: the diagnosis reproduced bright fragments under that setting.
Top-card shape, hairline finesse and real-phone aliasing remain art/QA work.
