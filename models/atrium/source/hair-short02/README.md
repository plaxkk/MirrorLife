# CC0 short02 hair study

Source: MakeHuman system asset pack, `hair/short02`, downloaded 2026-09-22.
Official listing: https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html
Archive and downloaded SHA-256 values are in `provenance.json`.

The OBJ, material and binding headers explicitly release these assets as CC0 in
September 2020. See the parent directory's `CC0-1.0.txt`. The original diffuse PNG
is retained unchanged. No MakeHuman application code is included.

`head-anchors.json` contains the 707 base-mesh vertices referenced by the binding
and its axis-scale anchors. It is extracted without coordinate changes from the
same CC0 `base.obj` already used for the resident head, SHA-256
`8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c`.
The keys are original zero-based vertex indices. Binding weights plus scaled
offsets adapt the authored hairstyle to that base before the resident affine fit.

Opt-in only: `ATRIUM_AUTHORED_HAIR_STUDY=short02`, `ATRIUM_RESIDENT_IDS=you`,
and `ATRIUM_BUILD_ROOT` beneath repository `tmp/`. Normal builds do not use short02.
The study retains hair-card topology and UVs at both LODs, exports 512px desktop and 256px mobile textures
with glTF MASK cutoff 0.4, and follows HeadPivot. It is not approved production art.
Keeping the card topology avoids decimation changing cutout silhouettes; mobile
cost and alpha-edge aliasing still require acceptance.

This alternative was not selected: the rendered fringe and side volume are too
helmet-like for the reference, despite greater texture visibility. The captured
initial short02 study predates the 256px mobile texture policy.
