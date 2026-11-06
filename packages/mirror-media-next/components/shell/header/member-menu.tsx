import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuPopup,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from '@/components/ui/link'
import { logout, useMembership } from '@/context/membership'
import { useReferrer } from '@/context/referrer'
import { useAppDispatch } from '@/hooks/useRedux'
import { loginActions } from '@/slice/login-slice'
import { getLoginHref } from '@/utils'

function MemberMenu() {
  const { isLoggedIn } = useMembership()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const getReferrer = useReferrer()

  if (!isLoggedIn) {
    return (
      <Link
        className="GTM-header-login shrink-0 rounded-mm-xs text-mm-body-s font-bold whitespace-nowrap text-mm-all-black"
        href={getLoginHref(router)}
        variant="plain"
      >
        登入
      </Link>
    )
  }

  function handleLogout() {
    dispatch(loginActions.resetLoginState())
    logout(getReferrer())
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="開啟會員選單"
        className="GTM-header-login"
        render={<Button size="icon-sm" variant="ghost" />}
      >
        <UserIcon aria-hidden="true" className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuPositioner align="end">
          <DropdownMenuPopup>
            <DropdownMenuLinkItem render={<NextLink href="/profile" />}>
              個人資料
            </DropdownMenuLinkItem>
            <DropdownMenuLinkItem
              render={<NextLink href="/profile/purchase" />}
            >
              訂閱紀錄
            </DropdownMenuLinkItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-mm-error-600 data-highlighted:bg-mm-error-100 data-highlighted:text-mm-error-700"
              onClick={handleLogout}
            >
              登出
            </DropdownMenuItem>
          </DropdownMenuPopup>
        </DropdownMenuPositioner>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}

export { MemberMenu }
