import { DrawerActions } from '@react-navigation/core'
import { useScrollToTop } from '@react-navigation/native'
import { FlashList } from '@shopify/flash-list'
import { default as React, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleProp, useColorScheme, View, ViewProps, ViewStyle } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import DollarIcon from 'src/assets/icons/dollar-sign.svg'
import ReceiveArrow from 'src/assets/icons/receive-arrow.svg'
import SendIcon from 'src/assets/icons/send.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { SHADOW_OFFSET_SMALL } from 'src/components/layout/BaseCard'
import { Screen } from 'src/components/layout/Screen'
import {
  HeaderConfig,
  panHeaderGestureAction,
  panSidebarContainerGestureAction,
  renderTabLabel,
  ScrollPair,
  TabContentProps,
  TAB_BAR_HEIGHT,
  TAB_STYLES,
  TAB_VIEW_SCROLL_THROTTLE,
  useScrollSync,
} from 'src/components/layout/TabHelpers'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import TraceTabView from 'src/components/telemetry/TraceTabView'
import { Text } from 'src/components/Text'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { useFiatOnRampEnabled } from 'src/features/experiments/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { dimensions } from 'src/styles/sizing'

const CONTENT_HEADER_HEIGHT_ESTIMATE = 264
const SIDEBAR_SWIPE_CONTAINER_WIDTH = 50

/**
 * Home Screen hosts both Tokens and NFTs Tab
 * Manages TokensTabs and NftsTab scroll offsets when header is collapsed
 * Borrowed from: https://stormotion.io/blog/how-to-create-collapsing-tab-header-using-react-native/
 */
export function HomeScreen() {
  // imports test account for easy development/testing
  useTestAccount()
  const activeAccount = useActiveAccountWithThrow()
  const navigation = useAppStackNavigation()
  const { t } = useTranslation()
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()

  const [tabIndex, setTabIndex] = useState(0)
  const routes = useMemo(
    () => [
      { key: SectionName.HomeTokensTab, title: t('Tokens') },
      { key: SectionName.HomeNFTsTab, title: t('NFTs') },
    ],
    [t]
  )

  const [headerHeight, setHeaderHeight] = useState(CONTENT_HEADER_HEIGHT_ESTIMATE)
  const headerConfig = useMemo<HeaderConfig>(
    () => ({
      heightCollapsed: insets.top,
      heightExpanded: headerHeight,
    }),
    [headerHeight, insets.top]
  )
  const { heightCollapsed, heightExpanded } = headerConfig
  const headerHeightDiff = heightExpanded - heightCollapsed

  const handleHeaderLayout = useCallback<NonNullable<ViewProps['onLayout']>>(
    (event) => setHeaderHeight(event.nativeEvent.layout.height),
    []
  )

  const tokensTabScrollValue = useSharedValue(0)
  const tokensTabScrollHandler = useAnimatedScrollHandler(
    (event) => (tokensTabScrollValue.value = event.contentOffset.y)
  )
  const nftsTabScrollValue = useSharedValue(0)
  const nftsTabScrollHandler = useAnimatedScrollHandler(
    (event) => (nftsTabScrollValue.value = event.contentOffset.y)
  )

  const tokensTabScrollRef = useAnimatedRef<FlatList>()
  const nftsTabScrollRef = useAnimatedRef<FlashList<any>>()

  const сurrentScrollValue = useDerivedValue(
    () => (tabIndex === 0 ? tokensTabScrollValue.value : nftsTabScrollValue.value),
    [tabIndex]
  )

  // Need to create a derived value for tab index so it can be referenced from a static ref
  const currentTabIndex = useDerivedValue(() => tabIndex, [tabIndex])
  const isNftTabsAtTop = useDerivedValue(() => nftsTabScrollValue.value === 0)

  useScrollToTop(
    useRef({
      scrollToTop: () => {
        if (currentTabIndex.value === 1 && isNftTabsAtTop.value) {
          setTabIndex(0)
        } else if (tabIndex === 1) {
          nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        } else {
          tokensTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        }
      },
    })
  )
  const translateY = useDerivedValue(() => {
    const offset = -Math.min(сurrentScrollValue.value, headerHeightDiff)
    return offset > 0 ? 0 : offset
  })

  const translatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const scrollPairs = useMemo<ScrollPair[]>(
    () => [
      { list: tokensTabScrollRef, position: tokensTabScrollValue },
      { list: nftsTabScrollRef, position: nftsTabScrollValue },
    ],
    [nftsTabScrollRef, nftsTabScrollValue, tokensTabScrollRef, tokensTabScrollValue]
  )

  const { sync } = useScrollSync(scrollPairs, headerConfig)

  const openSidebar = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer())
  }, [navigation])

  const contentHeader = useMemo(() => {
    return (
      <GestureDetector gesture={panHeaderGestureAction(openSidebar)}>
        <Flex bg="backgroundBranded" gap="xmd" pb="md" px="lg">
          <AccountHeader />
          <PortfolioBalance owner={activeAccount.address} />
          <QuickActions />
        </Flex>
      </GestureDetector>
    )
  }, [activeAccount.address, openSidebar])

  const contentContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      paddingTop: headerHeight + TAB_BAR_HEIGHT,
      paddingBottom: insets.bottom,
      minHeight: dimensions.fullHeight + headerHeightDiff,
    }),
    [headerHeight, insets.bottom, headerHeightDiff]
  )

  const loadingContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      paddingTop: headerHeight + TAB_BAR_HEIGHT,
      paddingBottom: insets.bottom,
    }),
    [headerHeight, insets.bottom]
  )

  const sharedProps = useMemo<TabContentProps>(
    () => ({
      loadingContainerStyle,
      contentContainerStyle,
      onMomentumScrollEnd: sync,
      onScrollEndDrag: sync,
      scrollEventThrottle: TAB_VIEW_SCROLL_THROTTLE,
    }),
    [contentContainerStyle, loadingContainerStyle, sync]
  )

  const tabBarStyle = useMemo<StyleProp<ViewStyle>>(
    () => [{ top: headerHeight }, translatedStyle],
    [headerHeight, translatedStyle]
  )

  const headerContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => [TAB_STYLES.headerContainer, { paddingTop: insets.top }, translatedStyle],
    [insets.top, translatedStyle]
  )

  const statusBarStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      сurrentScrollValue.value,
      [0, headerHeightDiff],
      [theme.colors.backgroundBranded, theme.colors.background0]
    ),
  }))

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      return (
        <>
          <Animated.View style={headerContainerStyle} onLayout={handleHeaderLayout}>
            {contentHeader}
          </Animated.View>
          <Animated.View style={[TAB_STYLES.header, tabBarStyle]}>
            <Box bg="background0">
              <TabBar
                {...sceneProps}
                indicatorStyle={TAB_STYLES.activeTabIndicator}
                navigationState={{ index: tabIndex, routes }}
                renderLabel={renderTabLabel}
                style={[
                  TAB_STYLES.tabBar,
                  {
                    backgroundColor: theme.colors.background0,
                    borderBottomColor: theme.colors.backgroundOutline,
                  },
                ]}
              />
            </Box>
          </Animated.View>
        </>
      )
    },
    [
      contentHeader,
      handleHeaderLayout,
      headerContainerStyle,
      routes,
      tabBarStyle,
      tabIndex,
      theme.colors.background0,
      theme.colors.backgroundOutline,
    ]
  )

  const renderTab = useCallback(
    ({ route }) => {
      switch (route?.key) {
        case SectionName.HomeNFTsTab:
          return (
            <NftsTab
              ref={nftsTabScrollRef}
              containerProps={sharedProps}
              owner={activeAccount?.address}
              scrollHandler={nftsTabScrollHandler}
            />
          )
        case SectionName.HomeTokensTab:
          return (
            <TokensTab
              ref={tokensTabScrollRef}
              containerProps={sharedProps}
              owner={activeAccount?.address}
              scrollHandler={tokensTabScrollHandler}
            />
          )
      }
      return null
    },
    [
      activeAccount?.address,
      nftsTabScrollHandler,
      nftsTabScrollRef,
      sharedProps,
      tokensTabScrollHandler,
      tokensTabScrollRef,
    ]
  )

  return (
    <Screen edges={['left', 'right']}>
      <View style={TAB_STYLES.container}>
        <TraceTabView
          initialLayout={{
            height: dimensions.fullHeight,
            width: dimensions.fullWidth,
          }}
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderTab}
          renderTabBar={renderTabBar}
          onIndexChange={(index) => setTabIndex(index)}
        />
      </View>
      <AnimatedBox
        height={insets.top}
        position="absolute"
        style={statusBarStyle}
        top={0}
        width="100%"
        zIndex="sticky"
      />
      <GestureDetector gesture={panSidebarContainerGestureAction(openSidebar)}>
        <Box
          bottom={0}
          left={0}
          position="absolute"
          top={headerHeight}
          width={SIDEBAR_SWIPE_CONTAINER_WIDTH} // Roughly 1/2 icon width on tokens tab
        />
      </GestureDetector>
    </Screen>
  )
}

function QuickActions() {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccountWithThrow()

  const { t } = useTranslation()

  const onPressBuy = () => {
    dispatch(openModal({ name: ModalName.FiatOnRamp }))
  }

  const onPressReceive = () => {
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }

  const onPressSend = useCallback(() => {
    dispatch(openModal({ name: ModalName.Send }))
  }, [dispatch])

  // hide fiat onramp banner when active account isn't a signer account.
  const fiatOnRampShown =
    useFiatOnRampEnabled() && activeAccount.type === AccountType.SignerMnemonic

  return (
    <Flex centered row gap="xs">
      {fiatOnRampShown && (
        <ActionButton
          Icon={DollarIcon}
          label={t('Buy')}
          name={ElementName.Buy}
          onPress={onPressBuy}
        />
      )}
      <ActionButton
        Icon={SendIcon}
        label={t('Send')}
        name={ElementName.Send}
        onPress={onPressSend}
      />
      <ActionButton
        Icon={ReceiveArrow}
        label={t('Receive')}
        name={ElementName.Receive}
        onPress={onPressReceive}
      />
    </Flex>
  )
}

function ActionButton({
  name,
  label,
  Icon,
  onPress,
}: {
  name: ElementName
  label: string
  Icon: React.FC<SvgProps>
  onPress: () => void
}) {
  const theme = useAppTheme()
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <TouchableArea
      hapticFeedback
      backgroundColor={isDarkMode ? 'backgroundBranded' : 'background0'}
      borderColor="brandedAccentSoft"
      borderRadius="lg"
      borderWidth={1}
      flex={1}
      name={name}
      padding="sm"
      shadowColor={isDarkMode ? 'black' : 'brandedAccentSoft'}
      shadowOffset={SHADOW_OFFSET_SMALL}
      shadowOpacity={0.4}
      shadowRadius={6}
      onPress={onPress}>
      <Flex centered row gap="xxs">
        <Icon
          color={theme.colors.magentaVibrant}
          height={theme.iconSizes.md}
          strokeWidth={2}
          width={theme.iconSizes.md}
        />
        <Text color="accentAction" variant="buttonLabelMedium">
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
