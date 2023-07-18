/* eslint-env node */

require('dotenv').config({ path: '.env.production' })
const child_process = require('child_process')
const fs = require('fs/promises')
const { promisify } = require('util')
const dataConfig = require('../graphql.data.config')
const thegraphConfig = require('../graphql.thegraph.config')

const exec = promisify(child_process.exec)

function fetchSchema(url, outputFile) {
  exec(
    `yarn --silent get-graphql-schema --h Origin=https://app.uniswap.org --h x-api-key=da2-pl5x75xr7rhwfezyhmmzemkz7u ${url}`
  )
    .then(({ stderr, stdout }) => {
      if (stderr) {
        throw new Error(stderr)
      } else {
        fs.writeFile(outputFile, stdout)
      }
    })
    .catch((err) => {
      console.error(err)
      console.error(`Failed to fetch schema from ${url}`)
    })
}

fetchSchema(process.env.THE_GRAPH_SCHEMA_ENDPOINT, thegraphConfig.schema)
fetchSchema('https://2hm3d6i3bfb43hcx33dk56mfey.appsync-api.us-east-1.amazonaws.com/graphql', dataConfig.schema)
