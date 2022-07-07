import React, { PropsWithChildren, ReactNode } from 'react'
import { Box, Flex } from 'src/components/layout'

type ExampleComponentProps = PropsWithChildren<{
  header: ReactNode
  success: Boolean
}>

export const ExampleComponent = ({ children, header, success }: ExampleComponentProps) => {
  return (
    <Box bg={success ? 'accentSuccessSoft' : 'accentFailureSoft'} borderRadius="md" p="md">
      <Flex flexDirection="column" gap="md">
        {header}
        {children}
      </Flex>
    </Box>
  )
}
