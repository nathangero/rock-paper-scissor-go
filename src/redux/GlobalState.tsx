import { Provider } from 'react-redux' ;
import { store } from './store'

export default function StoreProvider(props: any) {
  return <Provider store={store} {...props} />;
}