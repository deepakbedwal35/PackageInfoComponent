import NewComponent, {
  parseIntent,
  formatBytes,
  formatNumber,
  formatDate,
  detectTypeScript,
  detectEsm
} from "./NewComponent";
import { withHD } from '@hyperdart/frontend';

export {
  NewComponent,
  parseIntent,
  formatBytes,
  formatNumber,
  formatDate,
  detectTypeScript,
  detectEsm
};

export default withHD(NewComponent);
