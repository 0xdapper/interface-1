import { Circle, Text, XStack, YStack } from 'ui/src'
import { LinkButton } from 'ui/src/components/button/Button'

function InfoRow({
  primaryText,
  secondaryText,
}: {
  primaryText: string
  secondaryText: string
}): JSX.Element {
  return (
    <XStack alignItems="center" gap="$spacing12">
      <Circle backgroundColor="black" size={40} />
      <YStack>
        <Text variant="subheadLarge">{primaryText}</Text>
        <Text color="$textTertiary" variant="bodySmall">
          {secondaryText}
        </Text>
      </YStack>
    </XStack>
  )
}

export function IntroScreen(): JSX.Element {
  return (
    <XStack gap={100}>
      <YStack gap="$spacing12" maxWidth={320}>
        <Text
          marginBottom="$spacing48"
          textAlign="center"
          variant="headlineMedium">
          Get started with Uniswap Wallet
        </Text>
        <LinkButton theme="secondary" to="import">
          I already have a wallet
        </LinkButton>
        <LinkButton theme="primary" to="create">
          Create a new wallet
        </LinkButton>
      </YStack>
      <YStack gap="$spacing24" justifyContent="center">
        <InfoRow
          primaryText="Supercharge your swaps"
          secondaryText="1-click checkout"
        />
        <InfoRow
          primaryText="Multichain experience"
          secondaryText="Say goodbye to switching chains"
        />
        <InfoRow
          primaryText="Human readable transactions"
          secondaryText="No more hex codes"
        />
      </YStack>
    </XStack>
  )
}
