# Changelog

## [0.6.0](https://github.com/Miragon/slidev-deck-template/compare/slidev-validator-v0.5.1...slidev-validator-v0.6.0) (2026-08-14)


### ⚠ BREAKING CHANGES

* **validator:** content-heading is a required, error-level rule; the tighter budgets can newly fail decks that were green under the old limits.

### Features

* **validator:** tighten content-heading budgets and cover all title-bearing layouts ([#125](https://github.com/Miragon/slidev-deck-template/issues/125)) ([f4fac07](https://github.com/Miragon/slidev-deck-template/commit/f4fac079f0c5bb65525dd6d817b74830d76e0343))

## [0.5.1](https://github.com/Miragon/slidev-deck-template/compare/slidev-validator-v0.5.0...slidev-validator-v0.5.1) (2026-08-13)


### Bug Fixes

* **validator:** overlay-safe-area ignores decorative aria-hidden / pointer-events:none layers ([#121](https://github.com/Miragon/slidev-deck-template/issues/121)) ([f9c1bb7](https://github.com/Miragon/slidev-deck-template/commit/f9c1bb71f181f5379fbf81f3aea50db79d5c7ad7))

## [0.5.0](https://github.com/Miragon/slidev-deck-template/compare/slidev-validator-v0.4.0...slidev-validator-v0.5.0) (2026-08-13)


### Features

* **validator:** add `rules` command to list the rule catalog ([#119](https://github.com/Miragon/slidev-deck-template/issues/119)) ([96f792f](https://github.com/Miragon/slidev-deck-template/commit/96f792f2a6657d6aef370a4006e277ef1de571e4))

## [0.4.0](https://github.com/Miragon/slidev-deck-template/compare/slidev-validator-v0.3.0...slidev-validator-v0.4.0) (2026-08-13)


### Features

* **validator:** sanctioned-layout accepts deck-local deck/layouts/*.vue ([#116](https://github.com/Miragon/slidev-deck-template/issues/116)) ([44c2973](https://github.com/Miragon/slidev-deck-template/commit/44c2973ee3b5b6c7206a33c9186879ef323f9aae))

## [0.3.0](https://github.com/Miragon/slidev-deck-template/compare/slidev-validator-v0.2.0...slidev-validator-v0.3.0) (2026-08-13)


### Features

* **validator:** structure-agnostic source discovery for nested decks ([#114](https://github.com/Miragon/slidev-deck-template/issues/114)) ([f5abbdf](https://github.com/Miragon/slidev-deck-template/commit/f5abbdf915c25d84155ec4cb5c5ad82efaf97c9c))

## [0.2.0](https://github.com/Miragon/slidev-deck-template/compare/slidev-validator-v0.1.0...slidev-validator-v0.2.0) (2026-08-13)


### Features

* **validator:** extract guardrails into versioned @miragon/slidev-validator package ([#113](https://github.com/Miragon/slidev-deck-template/issues/113)) ([0255577](https://github.com/Miragon/slidev-deck-template/commit/02555777d48c46382f9524a5ce32f7e41ec9a1c0))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @miragon/slidev-toolkit bumped from >=1.15.0 <2 to >=1.16.0
