import React from 'react'
import { cloneDeep, get } from 'lodash'
import styles from './styles.module.scss'
import './style.css'


type StaticKeyObject = {
  [key: string]: any
}

export type DisplayProp<T extends StaticKeyObject, P extends Path<T>> = {
  label: string
  width?: number
  align?: 'left' | 'center' | 'right'
  render?: (value: PathValue<T, P>, index: number, row: T) => React.ReactNode
  // onClick?: (value: any) => void
}

type Path<T> = PathImpl<T, keyof T> | keyof T | string

type PathImpl<T, K extends keyof T> =
  K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends ArrayLike<any>
      ? K | `T${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
      : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
    : K
  : never

type PathValue<T, P extends Path<T>> =
  P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

export type Columns<T extends StaticKeyObject> = {
  [P in Path<T>]: DisplayProp<T, P> 
}

interface WindowSize {
  width: number
  height: number
}

const getTableWidth = (
  tableSize: WindowSize,
  minWidth?: number,
) => {
  const tableWidth = minWidth && tableSize.width < minWidth ? minWidth : tableSize.width
  return tableWidth
}

export const alignToClassName = (align: 'left' | 'center' | 'right' | undefined) => {
  switch (align) {
    case 'left':
    return 'justify-start'
    case 'center':
    return 'justify-center'
    case 'right':
    return 'justify-end'
    default:
    return ''
  }
}

const getTableColWidth = <T extends StaticKeyObject, K extends keyof T>(
  tableWidth: number,
  columns: Columns<T>,
) => {
  const cols = Object.keys(columns) as K[]
  const definedWidtes = cols
    .map(key => columns[key].width)
    .filter(x => x)
  const definedWidth = definedWidtes.reduce((a, b) => {
      return b !== undefined && a !== undefined ? a + b : b
    }, 0) ?? 0
  const colWidth: number[] = cols.map(key => {
    const { width } = columns[key]
    return width || (tableWidth - definedWidth) / (cols.length - definedWidtes.length)
  })
  return colWidth
}


interface DataTableHeaderProp<T extends StaticKeyObject> {
  tableSize: WindowSize
  columns: Columns<T>
  scrollLeft: number
  minWidth?: number
  onClick?: (key: string) => void
  sortDsiable?: boolean
  customClassName: string
}

const DataTableHeader = <T extends StaticKeyObject,>(props: DataTableHeaderProp<T>) => {
  const tableWidth = getTableWidth(props.tableSize, props.minWidth)
  const colWidth = getTableColWidth(tableWidth, props.columns)
  const cols = Object.keys(props.columns)
  const ensuredRef = React.useRef<HTMLTableElement>(null)
  const customClassName = `${props.customClassName}-header`

  React.useEffect(() => {
    if (ensuredRef.current) {
      ensuredRef.current.scrollLeft = props.scrollLeft
    }
  }, [ props.scrollLeft ])

  return (
    <div ref={ensuredRef} className={`${styles.tableHeaderWrap}`}>
      <div className={`${styles.tableHeader} ${customClassName}`} style={{ width: `${tableWidth}px` }}>
        <div className={styles.tr}>
          {cols.map((k, i) => (
            <div
              className={styles.th}
              key={`th-${k}`}
              style={{ width: `${colWidth[i]}px` }}
              onClick={() => {
                if (props.onClick && !props.sortDsiable) {
                  props.onClick(k)
                }
              }}
            >{props.columns[k].label}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export interface DataTableProp<T extends StaticKeyObject> {
  data: T[]
  columns: Columns<T>
  handleOnRowSelect?: (data: T) => void
  handleOnColumSelect?: (key: keyof T, data: T) => void
  handleOnSort?: (key: keyof Columns<T>, order: 'asc' | 'desc') => void | Promise<void>
  minWidth?: number
  maxHeight?: React.CSSProperties['maxHeight']
  minHeight?: React.CSSProperties['minHeight']
  limit?: number
  total?: number
  page?: number
  onChangePage?: (page: number) => Promise<void>
  footerHidden?: boolean
  sortDsiable?: boolean
  customClassName?: string
  noDataText?: string
}



const TableView = <T extends StaticKeyObject,>(
  props: DataTableProp<T>
) => {
  const [data, setData] = React.useState<T[]>(props.data)
  const [sortKey, setSortKey] = React.useState<keyof T>()
  const wrappRef = React.useRef<HTMLDivElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = React.useState(0)
  const [tableSize, setTableSize] = React.useState<WindowSize>({
    width: 0,
    height: 0,
  })

  const limit = props.limit ?? 10
  const [page, setPage] = React.useState(props.page ?? 1)
  const total = props.total ?? data.length
  const pages = Math.ceil(total / limit)
  const pagesRange = Array
    .from({ length: pages }, (_, i) => i + 1)
  const pageLimit = Math.max(...pagesRange)

  const tableWidth = getTableWidth(tableSize, props.minWidth)
  const [colWidth, setColWidth] = React.useState<number[]>(getTableColWidth(tableWidth, props.columns))
  const customClassName = props.customClassName ?? 'react-table'
  const customClassNameBody = `${customClassName}-body`
  // const customClassNameBodyWrapper = `${customClassName}-body-wrapper`
  const customClassNameRow = `${customClassName}-row`
  const customClassNameColum = `${customClassName}-colum`
  const customClassNameFooter = `${customClassName}-footer`
  const customClassNamePageItem = `${customClassName}-page-item`
  const customClassNameScrollbar = `${customClassName}-scrollbar`


  // Window Resize
  React.useEffect(() => {
    // Nextjs fix
    if (typeof window !== 'undefined' && wrappRef.current && bodyRef.current) {
      // Resize
      const handleResize = () => {
        // console.log('resize')
        const { width, height } = wrappRef.current?.getBoundingClientRect() ?? { width: 0, height: 0 }
        setTableSize({ width, height })
      }
      window.addEventListener('resize', handleResize)
      // Scroll
      const handleScroll = () => {
        // console.log(bodyRef.current?.scrollLeft)
        setScrollLeft(bodyRef.current?.scrollLeft ?? 0)
      }
      bodyRef.current.addEventListener('scroll', handleScroll)

      handleResize()
      handleScroll()
      setColWidth(getTableColWidth(tableWidth, props.columns))
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll)
      }
    }
    return () => {}
  }, [ props.columns, tableWidth ])

  React.useEffect(() => {
    setPage(props.page ?? 1)
  }, [ props.page ])

  React.useEffect(() => {
    setData(props.data)
  }, [props.data])

  React.useEffect(() => {
    return () => {
      setData([])
      setSortKey(undefined)
    }
  }, [])

  const handleOnSort = (key: keyof typeof props.columns) => {
    if (props.handleOnSort) {
      props.handleOnSort(key, sortKey === key ? 'desc' : 'asc')
    } else {
      data.sort((a, b) => {
        if (a[key] < b[key]) return key === sortKey ? -1 : 1
        if (a[key] > b[key]) return key === sortKey ? 1 : -1
        return 0
      })
      // console.log(data)
      setData(new Array(...data))
    }
    setSortKey(key === sortKey ? undefined : key)
  }

  const valueToRender = React.useCallback(<K extends DisplayProp<T, keyof T>>(display: K, key: keyof K, data: T, index: number): React.ReactNode => {
    if (display.render) {
      return display.render(get(data, key), index, data)
    }
    return get(data, key)
  }, [])

  const TableBody = React.useMemo(() => {
    const rows = props.page ? cloneDeep(data).splice((page - 1) * limit, limit) : data
    return (
      <div className={`${styles.tableBody}`}>
        {rows.map((x, i) => (
          <div
            key={`tr-${i}`}
            className={`${styles.tr} ${customClassNameRow}`}
            onClick={() => {
              if (props.handleOnRowSelect) props.handleOnRowSelect(x)
            }}
          >
            {(Object.keys(props.columns) as (keyof DisplayProp<T, keyof T>)[]).map((k, j) => (
              <div
                key={`td-${i}-${j}`}
                style={{ width: `${colWidth[j]}px` }}
                className={`${styles.td} ${alignToClassName(props.columns[k].align)} ${customClassNameColum}`}
                onClick={() => {
                  if (props.handleOnColumSelect) props.handleOnColumSelect(k, x)
                }}
              >
                {valueToRender(props.columns[k] as DisplayProp<T, keyof T>, k, x, i)}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }, [props, data, colWidth, valueToRender, page, limit])

  const handleOnChangePage = async (page: number) => {
    // console.log('handleOnChangePage', page)
    if (props.onChangePage) {
      await props.onChangePage(page)
    }
    if (props.page === undefined) {
      setPage(page)
    }
  }

  const wrapStyle = {
    maxHeight: props.maxHeight ?? 'auto',
    minHeight: props.minHeight ?? 'auto',
  }

  return (
    <div ref={wrappRef} className={styles.table}>
      <DataTableHeader
        columns={props.columns}
        onClick={handleOnSort}
        tableSize={tableSize}
        minWidth={props.minWidth}
        scrollLeft={scrollLeft}
        sortDsiable={props.sortDsiable}
        customClassName={customClassName}
      />
      <div
        className={`${customClassNameBody} ${customClassNameScrollbar}`}
        ref={bodyRef}
      >
        <div
          className={`relative`}
          style={wrapStyle}
        >
          <div
            style={{ width: `${parseInt(`${tableWidth}`)}px` }}
          >
            {props.data.length > 0 && TableBody}
          </div>
        </div>

        {props.data.length === 0 && (
          <div
            className={styles.noDataWrap}
          >
            <span
              className={styles.noDataText}
            >{props.noDataText ?? 'No data'}</span>
          </div>
        )}
      </div>

      {/** Pagination */}
      {!props.footerHidden && <div className={`${styles.tableFooter} ${customClassNameFooter}`}>
        <div className={styles.tablePaging}>
          {page !== 1 && 1 < page - 10 && (
            <div
              className={`${customClassNamePageItem} page-item-active`}
              onClick={() => handleOnChangePage(1)}
            >1</div>
          )}
          {pagesRange.filter(x => Math.abs(page - x) < 10).map(x => (
            <div
              key={`page-${x}`}
              className={`${customClassNamePageItem} ${x === page ? 'page-item-disabled' : 'page-item-active'}`}
              onClick={() => x === page ? null : handleOnChangePage(x)}
            >
              {x}
            </div>
          ))}
          {pageLimit > page && (
            <div
              className={`${customClassNamePageItem} ${pageLimit === page ? 'page-item-disabled' : 'page-item-active'}`}
              onClick={() => pageLimit === page ? null : handleOnChangePage(pageLimit)}
            >
              &rsaquo;
              &rsaquo;
            </div>
          )}
        </div>

        <div className=''>
          ({(page - 1) * limit}~{page * limit}) / {total}
        </div>
      </div>}

    </div>
  )
}

export default TableView
