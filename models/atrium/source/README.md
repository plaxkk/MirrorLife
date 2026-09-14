# Player head source

`makehuman-head.obj` contains only the head faces of MakeHuman's `body` group, with source UVs. Original axes are X lateral / Y up / Z forward. Extraction condition: all face vertices Y > 6. Original mesh retrieved 2026-09-14 from https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/3dobjs/base.obj . Original SHA-256 is retained in the OBJ header.

Original graphical data: Data Collection AB, Joel Palmius, Jonas Hauquier / MakeHuman community. Graphical assets are CC0 1.0; see `MAKEHUMAN-LICENSE.md` section C and `CC0-1.0.txt`. No MakeHuman program source is included or required. MirrorLife's parser, fitting, hair projection and facial deformation code is independently implemented in `scripts/atrium-human-head.py`.

This is an anatomical starting mesh, not a likeness reconstructed from the atrium reference. The reference's small faces do not supply exact facial geometry. MirrorLife adapts the head to its own stylized player, rig and palette. The full body and genital/helper meshes are not included.

The copied overview license uses a Markdown heading and trimmed trailing whitespace; its wording is unchanged.
