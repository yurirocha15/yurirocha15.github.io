# Yuri Rocha Portfolio

Personal portfolio for `www.yurirocha.com`.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The GitHub Pages workflow deploys the generated `dist` directory.

## Quality gate

```bash
npm run check
```

This runs ESLint, Vitest coverage, the production build, and the desktop/mobile
Playwright suite. Portfolio copy and metadata live in `src/content`, page
rendering in `src/components`, decorative project graphics in `src/visuals`,
and Three.js scene controllers in `src/scenes`.

## CV sources

The English, Korean, and Brazilian Portuguese one-page resumes and multi-page comprehensive CVs are generated from LaTeX sources in `cv/`. Docker keeps the local and CI toolchains consistent.

```bash
npm run cv:build
npm run cv:verify
```

Generated PDFs are ignored by Git and copied into the Pages artifact during the production build. See [`cv/README.md`](cv/README.md) for the publication and privacy policy.

## Third-party mesh attribution

| Included mesh | Original author and source | Local files | License |
| --- | --- | --- | --- |
| Franka FR3 links and Franka hand | Franka Robotics GmbH, [`frankarobotics/franka_description`](https://github.com/frankarobotics/franka_description) | `public/franka_description/meshes/` | Apache-2.0; the upstream [`LICENSE`](public/franka_description/LICENSE) and [`NOTICE`](public/franka_description/NOTICE) are retained. |
| Simplified smart-frame model | Artec Group Inc., [`artec3d.com`](https://www.artec3d.com/) | [`models/smart-frame/simplify_Frame.obj`](models/smart-frame/simplify_Frame.obj) (source), [`public/models/smart-frame/smart-frame.glb`](public/models/smart-frame/smart-frame.glb) (converted) | Creative Commons Attribution 3.0 Unported; the supplied [`license.txt`](public/models/smart-frame/license.txt) is retained. |

The FR3 visual meshes in `public/franka_description/meshes/robots/fr3/visual/` are modified: [`scripts/convert-fr3-visual-meshes.mjs`](scripts/convert-fr3-visual-meshes.mjs) converts the upstream COLLADA files of release 2.9.0 to GLB, grouping faces by colour, simplifying them and compressing them.

The smart-frame model is modified. The OBJ in `models/smart-frame/` is the original scan with the rolling dolly it was scanned on removed, and the openings the dolly's posts left in the floor closed. [`scripts/convert-smart-frame.mjs`](scripts/convert-smart-frame.mjs) converts it to GLB for the welding line, placing the body on its jig, simplifying it to 30% of its triangles, adding creased normals and compressing it.

The welding guns, arc torch, suction gripper, pallets, boxes, conveyors, tables, and other cell fixtures are modelled in this repository: [`scripts/blender/props.py`](scripts/blender/props.py) builds them in Blender, and `node scripts/build-props.mjs` exports them to `public/models/props/props.glb` and compresses it with meshopt. No third-party mesh files are shipped for those objects.

## Photo attribution

The non-WebGL scene fallback uses [an industrial robot photo by Freek Wolsink on Pexels](https://www.pexels.com/photo/industrial-robot-arm-in-a-manufacturing-facility-34207359/), distributed under the [Pexels license](https://www.pexels.com/license/).

## Software and design references

- The robot viewer uses [`gkjohnson/urdf-loaders`](https://github.com/gkjohnson/urdf-loaders) via the `urdf-loader` npm package, licensed Apache-2.0.
- The robotic arc torch in `scripts/blender/props.py` was informed by the primitive xacro torch definition in [`silanus23/hold_and_weld`](https://github.com/silanus23/hold_and_weld), licensed Apache-2.0. No mesh files from that project are copied into this repository.
- The welding-cell descriptions in [`pengrui-rio/welding-robot`](https://github.com/pengrui-rio/welding-robot/tree/master/weldingrobot_config/weldingrobot_description/weldingscene_description) were consulted during scene prototyping. No files from that project are copied into this repository.
- The 3D scenes are rendered with [`three`](https://github.com/mrdoob/three.js), licensed MIT.
