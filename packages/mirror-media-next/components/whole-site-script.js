import { useDisplayAd } from '../hooks/useDisplayAd'

import AvividScript from './ads/avivid/avivid-script'
import GPTScript from './ads/gpt/gpt-script'
import ComScoreScript from './comscore-script'
export default function WholeSiteScript() {
  const { shouldShowAd } = useDisplayAd()
  return (
    <>
      {shouldShowAd && <GPTScript />}
      {shouldShowAd && <AvividScript />}
      <ComScoreScript />
    </>
  )
}
