import {Observable} from 'rx'

export function csvDriver(csv$) {
  csv$.subscribe(csv => {
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'sparks-admin.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })

  return Observable.never()
}
