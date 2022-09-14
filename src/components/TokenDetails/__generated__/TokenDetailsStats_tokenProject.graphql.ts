/**
 * @generated SignedSource<<17e1575318e0b6e9beb2e2f9726d2c51>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type TokenDetailsStats_tokenProject$data = {
  readonly description: string | null;
  readonly homepageUrl: string | null;
  readonly markets: ReadonlyArray<{
    readonly fullyDilutedMarketCap: {
      readonly currency: Currency | null;
      readonly value: number | null;
    } | null;
    readonly marketCap: {
      readonly currency: Currency | null;
      readonly value: number | null;
    } | null;
    readonly price: {
      readonly currency: Currency | null;
      readonly value: number | null;
    } | null;
    readonly priceHigh52W: {
      readonly currency: Currency | null;
      readonly value: number | null;
    } | null;
    readonly priceLow52W: {
      readonly currency: Currency | null;
      readonly value: number | null;
    } | null;
    readonly volume24h: {
      readonly currency: Currency | null;
      readonly value: number | null;
    } | null;
  } | null> | null;
  readonly name: string | null;
  readonly tokens: ReadonlyArray<{
    readonly address: string | null;
    readonly chain: Chain;
    readonly decimals: number | null;
    readonly symbol: string | null;
  }>;
  readonly twitterName: string | null;
  readonly " $fragmentType": "TokenDetailsStats_tokenProject";
};
export type TokenDetailsStats_tokenProject$key = {
  readonly " $data"?: TokenDetailsStats_tokenProject$data;
  readonly " $fragmentSpreads": FragmentRefs<"TokenDetailsStats_tokenProject">;
};

const node: ReaderFragment = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "value",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "currency",
    "storageKey": null
  }
],
v1 = {
  "kind": "Literal",
  "name": "duration",
  "value": "YEAR"
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TokenDetailsStats_tokenProject",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "description",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "homepageUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "twitterName",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    },
    {
      "alias": null,
      "args": [
        {
          "kind": "Literal",
          "name": "currencies",
          "value": [
            "USD"
          ]
        }
      ],
      "concreteType": "TokenProjectMarket",
      "kind": "LinkedField",
      "name": "markets",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Amount",
          "kind": "LinkedField",
          "name": "price",
          "plural": false,
          "selections": (v0/*: any*/),
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "Amount",
          "kind": "LinkedField",
          "name": "marketCap",
          "plural": false,
          "selections": (v0/*: any*/),
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "Amount",
          "kind": "LinkedField",
          "name": "fullyDilutedMarketCap",
          "plural": false,
          "selections": (v0/*: any*/),
          "storageKey": null
        },
        {
          "alias": "volume24h",
          "args": [
            {
              "kind": "Literal",
              "name": "duration",
              "value": "DAY"
            }
          ],
          "concreteType": "Amount",
          "kind": "LinkedField",
          "name": "volume",
          "plural": false,
          "selections": (v0/*: any*/),
          "storageKey": "volume(duration:\"DAY\")"
        },
        {
          "alias": "priceHigh52W",
          "args": [
            (v1/*: any*/),
            {
              "kind": "Literal",
              "name": "highLow",
              "value": "HIGH"
            }
          ],
          "concreteType": "Amount",
          "kind": "LinkedField",
          "name": "priceHighLow",
          "plural": false,
          "selections": (v0/*: any*/),
          "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"HIGH\")"
        },
        {
          "alias": "priceLow52W",
          "args": [
            (v1/*: any*/),
            {
              "kind": "Literal",
              "name": "highLow",
              "value": "LOW"
            }
          ],
          "concreteType": "Amount",
          "kind": "LinkedField",
          "name": "priceHighLow",
          "plural": false,
          "selections": (v0/*: any*/),
          "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"LOW\")"
        }
      ],
      "storageKey": "markets(currencies:[\"USD\"])"
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Token",
      "kind": "LinkedField",
      "name": "tokens",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "chain",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "address",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "symbol",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "decimals",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "TokenProject",
  "abstractKey": null
};
})();

(node as any).hash = "06fdfe540839bbb0958c1104f39dcf08";

export default node;
