import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

// Create react-plotly.js component using standard factory pattern
// This uses plotly.js-dist-min for optimal bundle performance and full browser compatibility
const Plot = (createPlotlyComponent as unknown as { default: (p: typeof Plotly) => React.ComponentType<any> }).default
  ? (createPlotlyComponent as unknown as { default: (p: typeof Plotly) => React.ComponentType<any> }).default(Plotly)
  : (createPlotlyComponent as unknown as (p: typeof Plotly) => React.ComponentType<any>)(Plotly);

export default Plot;
