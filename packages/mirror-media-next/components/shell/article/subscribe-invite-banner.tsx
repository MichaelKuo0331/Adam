import { cn } from '@/components/cn'
import { Link } from '@/components/ui'
import { useMembership } from '@/context/membership'

type SubscribeInviteBannerProps = {
  className?: string
}

export function SubscribeInviteBanner({
  className,
}: SubscribeInviteBannerProps) {
  const { isLoggedIn } = useMembership()
  const href = isLoggedIn ? '/subscribe' : '/login/?destination=/subscribe'

  return (
    <section
      className={cn(
        'rounded-mm-xl bg-mm-base-700 p-mm-4xl text-lg leading-9 font-normal text-white',
        className
      )}
    >
      動態雜誌掌握趨勢，領先一步：
      從國際大事到生活小確幸，我們確保您不錯過任何一個重要瞬間，加入{' '}
      <Link
        href={href}
        variant="plain"
        className="text-lg font-normal text-mm-base-100 underline"
      >
        Premium 會員立即訂閱
      </Link>
      {' 。'}
    </section>
  )
}
