# OTA Updates (Expo Updates / EAS)

The mobile app uses `expo-updates` so we can ship JavaScript-only fixes
without cutting a new Play Store / App Store build.

## The one rule

> **JS / asset change → OTA. Native change → full build.**

Native changes include:

- Adding, removing, or upgrading any dependency that ships native code
  (anything you see installed under `node_modules/*/ios/` or
  `node_modules/*/android/`, plus most Expo SDK packages).
- Editing `app.json` `plugins`, `android.*`, `ios.*`, or `permissions`.
- Bumping the Expo SDK major.
- Anything that changes the AAB's APK manifest.

If a release crosses one of those lines, you **must** rebuild with
`eas build` and submit a new AAB. OTA-ing a native change to old binaries
will crash the app on launch.

When in doubt, rebuild. The five-minute uncertainty is cheaper than a
crash-loop rollout.

## Channels and branches

`eas.json` and `app.json` are configured for three channels. Each channel
maps to an EAS Update branch with the same name.

| Profile / channel | Use it for |
|---|---|
| `development` | Dev clients used on the team's devices. |
| `preview` | Internal release-candidate builds, side-loaded APKs. |
| `production` | Builds that ship through Play Store and (later) App Store. |

`runtimeVersion.policy: "appVersion"` in `app.json` means every binary is
pinned to its own `version` string. An OTA published under
`production / 1.0.0` will **only** be delivered to binaries whose
`app.json` version is `1.0.0`. Bumping `version` requires a new build.

## Shipping an OTA

```bash
cd client/mobile
npm run update:production     # or update:preview / update:development
```

The `--auto` flag picks up the current git commit message + branch and
labels the update accordingly. To customize:

```bash
npx eas update --branch production --message "fix: crash on cold start when settings is the deep link target"
```

After publishing, monitor:

- The EAS dashboard "Updates" tab for delivery counts.
- Play Console "Vitals → Crashes" for any spike in the next 24 hours.

## Rollback

EAS Update keeps every published update. To roll back, republish the
previous good update with `eas update --republish --group <update-group-id>`,
or simply ship a new fix. There's no "delete the bad update" — even after
republishing, clients that already downloaded the bad version will hold
onto it until they fetch the new one.

## Pre-flight checklist before every OTA

- [ ] `npx tsc --noEmit` clean.
- [ ] `npx expo lint --max-warnings=0` clean.
- [ ] The change does not touch native code (see "the one rule").
- [ ] You're on the right git branch and the right tree is committed —
      `--auto` uses the current commit metadata.
- [ ] You've published to `preview` and validated on a real device first
      if the change is risky.

## Limits and footguns

- **Asset budget:** keep individual asset diffs small. EAS Update sends
  only the diff but a 10MB hero image will be 10MB on every fetch.
- **Sentry / observability:** if you wire crash reporting, source-map
  uploading must run before publishing or symbols will be wrong.
- **app.json runtime drift:** never edit `app.json` and then push an OTA in
  the same commit — the binary's `app.json` is baked into the AAB at
  build time, so the runtime version will drift from the published-against
  runtime and the OTA won't reach the device.
- **Updates are downloaded asynchronously.** Users see the fix on the
  *next* app launch after the device fetches the update, not the launch
  during which the fetch happens.

## When you genuinely need to test OTA delivery

1. Build a `preview` profile AAB and side-load it onto a real device.
2. Open the app once so the embedded `production`-style runtime is
   primed.
3. From your workstation, `npm run update:preview` with a clearly
   identifiable change (e.g., change a string on the home screen).
4. Background and re-foreground the app. The new string should appear on
   the **second** launch (first launch fetches the update, second uses
   it). On Android you may need to kill the process.

This is the only reliable way to confirm channels are wired correctly
end-to-end. Do it once after `eas init` and any time the channel config
changes.
