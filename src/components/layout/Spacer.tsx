import React, { ComponentProps } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type SpacerProps = ComponentProps<typeof Box> & {
  x?: keyof Theme['spacing']
  y?: keyof Theme['spacing']
}

/**
 * Layout component to render physical spacing.
 * Useful to avoid using margin props which break component isolation
 */
export function Spacer({ x, y, ...rest }: SpacerProps): JSX.Element {
  const theme = useAppTheme()
  return (
    <Box
      flexGrow={0}
      flexShrink={0}
      height={y ? theme.spacing[y] : undefined}
      width={x ? theme.spacing[x] : undefined}
      {...rest}
    />
  )
}
