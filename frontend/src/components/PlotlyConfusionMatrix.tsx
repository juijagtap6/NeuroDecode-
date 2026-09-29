import React from 'react';
import Plot from 'react-plotly.js';

interface PlotlyConfusionMatrixProps {
  classLabels: string[];
  matrix: number[][];
  normalizedMatrix: number[][];
  showNormalized: boolean;
}

export const PlotlyConfusionMatrix: React.FC<PlotlyConfusionMatrixProps> = ({
  classLabels,
  matrix,
  normalizedMatrix,
  showNormalized,
}) => {
  const currentMatrix = showNormalized ? normalizedMatrix : matrix;
  const zValues = currentMatrix;
  const textValues = currentMatrix.map((row, rIdx) =>
    row.map((val, cIdx) =>
      showNormalized
        ? `True: ${classLabels[rIdx]}<br>Pred: ${classLabels[cIdx]}<br>Rate: ${(val * 100).toFixed(1)}% (${matrix[rIdx][cIdx]} trials)`
        : `True: ${classLabels[rIdx]}<br>Pred: ${classLabels[cIdx]}<br>Count: ${val} trials`
    )
  );

  return (
    <div style={{ width: '100%', height: '420px', minHeight: '400px' }}>
      <Plot
        data={[
          {
            type: 'heatmap',
            z: zValues,
            x: classLabels,
            y: classLabels,
            hoverinfo: 'text',
            text: textValues,
            colorscale: [
              [0, '#0f172a'],
              [0.2, '#1e1b4b'],
              [0.5, '#4338ca'],
              [0.8, '#7c3aed'],
              [1.0, '#a855f7'],
            ],
            showscale: true,
            colorbar: {
              tickfont: { color: '#94a3b8' },
              title: {
                text: showNormalized ? 'Ratio' : 'Trials',
                font: { color: '#cbd5e1', size: 12 },
              },
            },
          },
        ]}
        layout={{
          autosize: true,
          margin: { l: 80, r: 40, b: 80, t: 40, pad: 4 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          xaxis: {
            title: { text: 'Predicted Class', font: { color: '#cbd5e1', size: 13 } },
            tickfont: { color: '#94a3b8', size: 11 },
            gridcolor: '#1e293b',
          },
          yaxis: {
            title: { text: 'True Class', font: { color: '#cbd5e1', size: 13 } },
            tickfont: { color: '#94a3b8', size: 11 },
            gridcolor: '#1e293b',
            autorange: 'reversed',
          },
          font: { family: 'Inter, system-ui, sans-serif' },
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false, responsive: true }}
      />
    </div>
  );
};
