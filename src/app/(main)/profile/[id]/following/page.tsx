import { FollowListPage } from '../FollowListPage'

export default async function FollowingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FollowListPage id={id} kind="following" />
}
