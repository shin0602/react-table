# React Table 

## Install
```sh
yarn add @shin0602/react-table
```
OR
```sh
npm -i @shin0602/react-table
```




## Preview

![react_table](https://user-images.githubusercontent.com/6999412/184323564-a70d3b2e-bfde-46bc-bede-50cbcb836ba2.gif)







### Example
```tsx
import React from 'react'
import TableView from '@shin0602/react-table'

const sampleDatas = [
  {
    id: 1,
    name: 'John Doe',
    age: 32,
    address: {
      postalCode: '12345',
      city: 'New York',
    },
  },
  ...
]


function App() {
  const [page, setPage] = React.useState(1)
  const limit = 5
  return (
    <TableView
      // customClassName='my-table' // if you want to use custom className
      data={sampleDatas}
      // data={[] as typeof sampleDatas}
      page={page}
      limit={limit}
      minWidth={960} // minWidth (px)
      minHeight={'10rem'}
      maxHeight={'10rem'}
      onChangePage={async (page) => setPage(page)}
      columns={{ // display columns
        id: {
          label: 'ID', // display label
          width: 100,  // optional display width (px)
          // align: 'right', // optional display align (left, right, center)
          // render: (value: data[index], index: number, row) => <div>{value}</div>, // optional display render function
        },
        name: {
          label: 'Name',
        },
        age: {
          label: 'Age',
          align: 'right',
        },
        // dot path is supported
        'address.postalCode': {
          label: 'Address',
            render: (_value, _i,row) => (
              <div>
                <p>{row.address.postalCode}</p>
                <p>{row.address.city}</p>
              </div>
            ),
        },
      }}
    />
  )
}

```
### Custom Styles

```stylesheet
// <TableView 
// customClassName='my-table' // class name

.my-table-header {
  background-color: #555;
  color: #fff;
}

.my-table-body {
  background-color: #f3f3f3;
}

.my-table-row {
  background-color: #f9f9f9;
  border: 1px solid gray;
  border-top-width: 0;
  border-right-width: 0;
  border-left-width: 0;
}

.my-table-row:hover {
  background-color: #fafafa;
}

.my-table-colum:hover {
  background-color: #fff;
}

.my-table-footer {
  background-color: #f3f3f3;
}

.my-table-page-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid;
  border-color: color-2;
  transition: all 0.2s ease-in-out;
}
```


