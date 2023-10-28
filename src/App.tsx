import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee} from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [state, setState] = useState(0)
  
  const transactions = useMemo(
    () => {
      let result
      if(state === 1)  result = (paginatedTransactions?.data ?? null)
      else if(state === 2) result = (transactionsByEmployee ?? null)
      return result === undefined ? null : result

    },
    [paginatedTransactions, transactionsByEmployee]
  )
  

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()
    setState(1)
    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()
    
    
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    
    async (employeeId: string) => {
      
      paginatedTransactionsUtils.invalidateData()
      setState(2)
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

          <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            
            if (newValue === null) {
              return
            }
            newValue.id == "" ? await loadAllTransactions() : await loadTransactionsByEmployee(newValue.id )
            
          }}
        />
      

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />
          
          {(transactions !== null && transactionsByEmployee === null && paginatedTransactions?.nextPage !== null) &&
           (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading }
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
          
        </div>
      </main>
    </Fragment>
  )
}
