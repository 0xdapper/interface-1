import React from 'react'
import { Image } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { resizeModeContain } from 'src/styles/image'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  backgroundColor?: string
  borderRadius: number
  uri: string
  height: number
  width: number
}

export function RemoteImage({ backgroundColor, borderRadius, uri, height, width }: Props) {
  const imageHttpUrl = uriToHttp(uri)[0]

  if (imageHttpUrl.endsWith('.svg')) {
    return (
      <SvgUri
        height={height}
        style={{ backgroundColor, borderRadius }}
        uri={imageHttpUrl}
        width={width}
      />
    )
  }

  return (
    <Image
      source={{ uri: imageHttpUrl }}
      style={{
        backgroundColor,
        borderRadius,
        height,
        resizeMode: resizeModeContain,
        width,
      }}
    />
  )
}
