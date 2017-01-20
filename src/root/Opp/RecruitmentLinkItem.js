import {Observable as $} from 'rx'

import {
  ListItemNewTarget,
} from 'components/sdm'

export const RecruitmentLinkItem = sources => ListItemNewTarget({...sources,
  title$: $.just('Check out your Recruiting page in a new window.'),
  iconName$: $.just('link'),
  url$: $.combineLatest(
    sources.projectKey$, sources.opp$,
    (pk, opp) => opp.isPublilc ?
      '/apply/' + pk + '/opp/' + opp.$key :
      `/apply/${pk}/private/${opp.$key}/opp/${opp.$key}`
  ),
})
