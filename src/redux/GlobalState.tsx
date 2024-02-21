import { Provider } from 'react-redux' ;
import { store } from './store'

export default function StoreProvider(props: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  return <Provider store={store} {...props} />;
}