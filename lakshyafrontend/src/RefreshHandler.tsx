import { useEffect } from "react"

function RefreshHandler({ setIsAuthenticated }: { setIsAuthenticated: (value: boolean) => void }) {
  
  useEffect(() => {
    if (localStorage.getItem("token")) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [setIsAuthenticated])

  return (
    null
  )
}

export default RefreshHandler;