import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import { Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loading } from 'src/components/loading'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import {
  startFetchingICloudBackups,
  stopFetchingICloudBackups,
} from 'src/features/CloudBackup/RNICloudBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { ONE_SECOND_MS } from 'src/utils/time'
import { useTimeout } from 'src/utils/timing'

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackupLoading
>

const MIN_LOADING_UI_MS = ONE_SECOND_MS
// 10s timeout time for query for backups, since we don't know when the query completes
const MAX_LOADING_TIMEOUT_MS = ONE_SECOND_MS * 10

export function RestoreCloudBackupLoadingScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const entryPoint = params?.entryPoint

  const [isLoading, setIsLoading] = useState(true)
  const backups = useCloudBackups()

  // Starts query for iCloud backup files, backup files found are streamed into Redux
  useEffect(() => {
    const timer = fetchICloudBackupsWithTimeout()

    return () => {
      stopFetchingICloudBackups()
      clearTimeout(timer)
    }
  }, [])

  const fetchICloudBackupsWithTimeout = () => {
    // Show loading state for max 10s, then show no backups found
    setIsLoading(true)
    startFetchingICloudBackups()

    return setTimeout(() => {
      logMessage(LogContext.CloudBackup, 'Timed out fetching iCloud backups')
      setIsLoading(false)
      stopFetchingICloudBackups()
    }, MAX_LOADING_TIMEOUT_MS)
  }

  // After finding backups, show loading state for minimum 1s to prevent screen changing too quickly
  useTimeout(
    backups.length > 0
      ? () => {
          if (backups.length === 1) {
            const backup = backups[0]
            navigation.replace(OnboardingScreens.RestoreCloudBackupPassword, {
              importType: ImportType.Restore,
              entryPoint,
              mnemonicId: backup.mnemonicId,
            })
          } else {
            navigation.replace(OnboardingScreens.RestoreCloudBackup, {
              importType: ImportType.Restore,
              entryPoint,
            })
          }
        }
      : undefined,
    MIN_LOADING_UI_MS
  )

  // Handle no backups found error state
  if (!isLoading && backups.length === 0) {
    return (
      <Box alignSelf="center" px="md">
        <BaseCard.ErrorState
          description={t(`It looks like you haven't backed up any of your seed phrases to iCloud.`)}
          icon={
            <CloudIcon
              color={theme.colors.textTertiary}
              height={theme.imageSizes.xxl}
              width={theme.imageSizes.xxl}
            />
          }
          retryButtonLabel={t('Retry')}
          title={t('0 backups found')}
          onRetry={fetchICloudBackupsWithTimeout}
        />
      </Box>
    )
  }

  return (
    <OnboardingScreen title={t('Searching for backups...')}>
      <Loading repeat={5} type="wallets" />
    </OnboardingScreen>
  )
}
