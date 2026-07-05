// Global test setup.
//
// The real @expo/vector-icons Icon component (createIconSet) loads its font
// asynchronously in componentDidMount and calls setState once the font
// resolves. In tests that resolution lands on a microtask *after* the test
// (and often after the whole suite) has finished, producing React's
// "An update to Icon inside a test was not wrapped in act(...)" warning and,
// in multi-suite runs, a fatal "Cannot log after tests are done" that makes
// jest exit non-zero even though every test passed.
//
// Stubbing the icon set removes the async font load at its source: every icon
// family renders a synchronous Text node, so nothing schedules a post-teardown
// state update. Individual suites may still declare their own
// jest.mock('@expo/vector-icons', ...) — that override takes precedence for
// that file.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const makeIconComponent = () =>
    ({ name }) => React.createElement(Text, { testID: `icon-${name}` }, name);

  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') return true;
        return makeIconComponent();
      },
    },
  );
});
