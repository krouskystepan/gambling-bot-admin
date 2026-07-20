/**
 * Single entry point for the read-only presentation ("demo") mode.
 *
 * Everything demo-related lives under `src/lib/presentation/**` and is surfaced
 * only through this barrel so the rest of the codebase never imports fixture
 * internals directly. Main-code files touch presentation mode with a single
 * `import { ... } from '@/lib/presentation'` line and a one-line guard.
 *
 * NOTE: This barrel is server-side only. Client UI imports the components under
 * `@/components/presentation`.
 */

export {
  DEMO_GUILD_ID,
  PRESENTATION_USER_ID,
  isPresentationRequest,
  isDemoGuild
} from './presentationMode'

export { getPresentationSession } from './presentationSession'

export {
  DEMO_MUTATION_MESSAGE,
  rejectDemoMutation,
  assertNotDemoMutation,
  type DemoMutationRejection
} from './rejectDemoMutation'

export {
  DEMO_GUILD_NAME,
  DEMO_TIMEZONE,
  demoGlobalSettings,
  getDemoDiscordMembers,
  getDemoStaffMembers
} from './fixtures/demoGuild'

export { getDemoOverviewData } from './fixtures/demoOverview'
export { getDemoUsers } from './fixtures/demoUsers'
export {
  getDemoTransactions,
  getDemoTransactionCounts
} from './fixtures/demoTransactions'
export {
  getDemoAtmRequests,
  getDemoAtmRequestCounts
} from './fixtures/demoAtmQueue'
export {
  getDemoSystemHealthData,
  getDemoSetupHealthChecks
} from './fixtures/demoHealth'
export {
  getDemoPnLBySource,
  getDemoGuildTaxPeriodSummary,
  getDemoStaffTaxPeriodSummary
} from './fixtures/demoReports'
export {
  getDemoStaffActions,
  getDemoStaffActionCounts,
  getDemoStaffActionEntityFacets
} from './fixtures/demoStaffActions'
export {
  getDemoSettingsChanges,
  getDemoSettingsChangeCounts,
  getDemoSettingsChangeEntityFacets
} from './fixtures/demoSettingsChanges'
export {
  getDemoPredictions,
  getDemoPredictionPageContext,
  getDemoRaffles,
  getDemoRafflePageContext,
  getDemoVips,
  getDemoVipPageContext
} from './fixtures/demoEngagement'
export { getDemoUserProfile } from './fixtures/demoUserProfile'
export {
  getDemoGlobalSettings,
  getDemoCasinoSettings,
  getDemoChannels,
  getDemoBonusSettings,
  getDemoVipSettings,
  getDemoModerationSettings,
  getDemoGuildChannels,
  getDemoGuildRoles,
  getDemoGuildCategories
} from './fixtures/demoSettings'
export {
  getDemoDevDatabaseStatus,
  getDemoDevEnvStatus,
  getDemoDevGuildCounts,
  getDemoDevBotPresence,
  getDemoDevDiscordGuild,
  getDemoDevChannelChecks,
  getDemoDevGuildConfig,
  getDemoDevRecentTransactions,
  getDemoDevCalcsSettings
} from './fixtures/demoDev'
