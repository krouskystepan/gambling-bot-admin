import FeatureLayout from '@/features/FeatureLayout'

const HomePage = ({ guildId }: { guildId: string }) => {
  return (
    <FeatureLayout title={'Home'}>
      <div>
        <h3 className="text-3xl font-bold">GUILD ID: {guildId}</h3>
        <p>Coming soon...</p>
      </div>
    </FeatureLayout>
  )
}

export default HomePage
