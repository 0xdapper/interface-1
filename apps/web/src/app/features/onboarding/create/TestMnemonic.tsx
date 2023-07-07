import { useCallback, useMemo, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingInput } from 'src/app/features/onboarding/OnboardingInput'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { UniconWithLockIcon } from 'src/app/features/onboarding/UniconWithLockIcon'
import {
  CreateOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Stack, Text, XStack } from 'ui/src'

export function TestMnemonic({ numberOfTests = 4 }: { numberOfTests?: number }): JSX.Element {
  const navigate = useNavigate()

  const { pendingAddress: createdAddress, pendingMnemonic: createdMnemonic } =
    useOnboardingContext()
  const [completedTests, markTestCompleted] = useReducer((v: number) => v + 1, 0)
  const [userWordInput, setUserWordInput] = useState<string>('')

  const isLastTest = useCallback(
    (): boolean => completedTests === numberOfTests - 1,
    [completedTests, numberOfTests]
  )

  // Pick NUMBER_OF_TESTS random words
  const testingWordIndexes = useMemo(
    () =>
      createdMnemonic ? selectRandomNumbers(createdMnemonic.length, numberOfTests) : undefined,
    [createdMnemonic, numberOfTests]
  )

  // Save the next word index for reuse, ensuring it's not undefined
  const nextWordIndex = useMemo(
    () => testingWordIndexes?.[completedTests] ?? 0,
    [completedTests, testingWordIndexes]
  )
  const nextWordNumber = nextWordIndex + 1

  const onNext = useCallback((): void => {
    if (!createdMnemonic || !createdAddress) {
      return
    }
    const validWord = userWordInput === createdMnemonic[nextWordIndex]
    if (validWord && isLastTest()) {
      navigate(
        `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/${CreateOnboardingRoutes.Naming}`
      )
    } else if (validWord) {
      markTestCompleted()
      setUserWordInput('')
    } else {
      // TODO error state / notify user in some way, not yet designed
    }
  }, [createdAddress, createdMnemonic, isLastTest, navigate, nextWordIndex, userWordInput])

  return (
    <OnboardingScreen
      nextButtonEnabled
      Icon={<UniconWithLockIcon address={createdAddress ?? ''} />}
      nextButtonText="Next"
      subtitle="Let's make sure you've recorded it down"
      title={
        <Stack paddingHorizontal="$spacing36">
          <Text variant="headlineMedium">
            What's the <Text color="$magentaVibrant">{getNumberWithOrdinal(nextWordNumber)} </Text>{' '}
            word of your recovery phrase?
          </Text>
        </Stack>
      }
      onSubmit={onNext}>
      <XStack position="relative" width="100%">
        <Text
          color="$textTertiary"
          padding="$spacing24"
          position="absolute"
          variant="headlineSmall">
          {String(nextWordNumber).padStart(2, '0')}
        </Text>
        <OnboardingInput
          centered
          placeholderText=""
          value={userWordInput}
          onChangeText={setUserWordInput}
          onSubmit={onNext}
        />
      </XStack>
    </OnboardingScreen>
  )
}

// https://stackoverflow.com/a/31615643
function getNumberWithOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function selectRandomNumbers(maxNumber: number, numberOfNumbers: number): number[] {
  const shuffledIndexes = [...Array(maxNumber).keys()].sort(() => 0.5 - Math.random())
  const selectedIndexes = shuffledIndexes.slice(0, numberOfNumbers)
  selectedIndexes.sort((a, b) => a - b)
  return selectedIndexes
}
