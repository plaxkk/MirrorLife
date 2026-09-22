# CC0 source skin study

Unmodified diffuse PNG and material metadata from the official MakeHuman system asset pack, skins/young_asian_male, retrieved 2026-09-23. The official listing declares CC0 and the material header explicitly records a September 2020 CC0 release by Data Collection AB, Joel Palmius and Jonas Hauquier. See ../CC0-1.0.txt and provenance.json for URLs and exact downloaded hashes.

The PNG is an anatomical whole-body UV atlas, used only as input for the fitted head. No body mesh or MakeHuman program code is included. Only the head surface is rebaked into MirrorLife's isolated runtime atlas. The source PNG is unchanged. The original MHMAT shader configuration is reference metadata, not executed or installed.

ATRIUM_SOURCE_SKIN_STUDY=1 requires the isolated face-paint study. Native head UVs and locally fitted eyelid UVs are retained in SourceUV while the runtime atlas is baked to UVMap. The initial blend is 72% source skin and 28% authored colour. The current v2 blend is 60% source skin, with source-node saturation 0.85 and value 1.35 before blending. This is an art experiment, not an accepted production skin.
