// @flow
import React from 'react';

const PageLinks = () => (
  <table width="100%">
    <tbody>
      <tr>
        <td><b>Render to String</b></td>
        <td><a href="/nocache">not cached (string)</a></td>
        <td><a href="/">cached (string)</a></td>
        <td><a href="/template?name=tom">cache template (string)</a></td>
      </tr>
      <tr>
        <td><b>Render to Stream</b></td>
        <td><a href="/streamnocache">not cached (stream)</a></td>
        <td><a href="/stream">cached (stream)</a></td>
        <td><a href="/streamtemplate?name=tom">cache template (stream)</a></td>
      </tr>
    </tbody>
  </table>
);

PageLinks.getCacheKey = () => `PageLinks`;

export default PageLinks;
