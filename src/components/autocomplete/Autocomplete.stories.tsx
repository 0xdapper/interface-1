import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Autocomplete } from 'src/components/autocomplete/Autocomplete'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

const DEFAULT_OPTIONS = [
  { data: 'ETH', key: 'eth' },
  { data: 'DAI', key: 'dai' },
  { data: 'MKR', key: 'mkr' },
  { data: 'BTC', key: 'btc' },
]

export default {
  title: 'Components/Autocomplete',
  component: Autocomplete,
  decorators: [
    (Story) => (
      <Box bg="gray100" borderRadius="md" p="lg" width={400}>
        <Story />
      </Box>
    ),
  ],
  args: {
    filterOptions: (pattern: string, options: typeof DEFAULT_OPTIONS) =>
      pattern
        ? options.filter((o) => o.data.toLowerCase().includes(pattern.toLowerCase()))
        : options,
    options: DEFAULT_OPTIONS,
    placeholder: 'Search tokens',
    renderOption: (option: typeof DEFAULT_OPTIONS[0]) => (
      <Flex row alignItems="center" gap="sm">
        <Box bg="black" borderRadius="full" p="md" />
        <Text>{option.data}</Text>
      </Flex>
    ),
    EmptyComponent: (
      <Flex centered gap="sm" mt="lg" px="lg">
        <Text variant="h4">😔</Text>
        <Text variant="h4">No results found</Text>
      </Flex>
    ),
  },
} as ComponentMeta<typeof Autocomplete>

export const Primary: ComponentStory<typeof Autocomplete> = (args) => <Autocomplete {...args} />

export const Custom: ComponentStory<typeof Autocomplete> = (args) => (
  <Autocomplete
    {...args}
    InitialComponent={
      <Flex>
        <Text color="gray400">Can provide an initial component</Text>
        <Text fontSize={16}>Suggestions</Text>
        <Flex>
          <Flex row alignItems="center" gap="sm">
            <Box bg="black" borderRadius="full" p="md" />
            <Text>ETH</Text>
          </Flex>
          <Flex row alignItems="center" gap="sm">
            <Box bg="black" borderRadius="full" p="md" />
            <Text>DAI</Text>
          </Flex>
          <Flex row alignItems="center" gap="sm">
            <Box bg="black" borderRadius="full" p="md" />
            <Text>MKR</Text>
          </Flex>
        </Flex>
      </Flex>
    }
  />
)
