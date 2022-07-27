import { OnboardingScreens } from 'src/screens/Screens'

export enum ImportType {
  Create = 'Create',
  SeedPhrase = 'SeedPhrase',
  Watch = 'Watch',
  Restore = 'Restore',
}

export enum OnboardingEntryPoint {
  Sidebar = 'Sidebar',
  FreshInstall = 'FreshInstall',
}

// Screens in order based on the import method being used. Currently only used for onboarding header indicator
const FLOWS: Record<ImportType, OnboardingScreens[]> = {
  [ImportType.Create]: [
    OnboardingScreens.EditName,
    OnboardingScreens.SelectColor,
    OnboardingScreens.Backup,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  [ImportType.SeedPhrase]: [
    OnboardingScreens.SeedPhraseInput,
    OnboardingScreens.SelectWallet,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  [ImportType.Watch]: [
    OnboardingScreens.WatchWallet,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  // @TODO Fill out restore flow.
  [ImportType.Restore]: [],
}

export function getFlow(
  importType: ImportType,
  isBiometricAuthEnabled: boolean,
  hasSeedPhrase: boolean,
  isInitialOnboarding: boolean
): OnboardingScreens[] {
  let flows = FLOWS[importType]
  if (isBiometricAuthEnabled && !isInitialOnboarding) {
    flows = flows.filter((screen) => screen !== OnboardingScreens.Security)
  }

  if (hasSeedPhrase) {
    flows = flows.filter((screen) => screen !== OnboardingScreens.Backup)
  }
  return flows
}

// Reference the flow description to detect the index within total steps based on screen name.
export function getStepNumber(flow: OnboardingScreens[], screenName?: OnboardingScreens) {
  if (!screenName) return undefined
  const stepNumber = flow.indexOf(screenName)
  return stepNumber === -1 ? undefined : stepNumber
}
