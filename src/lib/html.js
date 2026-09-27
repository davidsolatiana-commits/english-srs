// htm = sintaxis tipo JSX sin paso de compilación: html`<${Comp} prop=${x} />`
import React from 'react';
import htm from 'htm';

export const html = htm.bind(React.createElement);
