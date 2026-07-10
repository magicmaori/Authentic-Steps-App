const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SPM_PATCH = `
# Fix: react-native 0.81.5 + @clerk/expo ClerkKit SPM crash
# Error: undefined method 'package_dependencies' for nil:NilClass in spm.rb
# Must be injected AFTER use_native_modules! so add_spm_to_target is already defined.
if respond_to?(:add_spm_to_target, true)
  _orig_add_spm = method(:add_spm_to_target)
  define_singleton_method(:add_spm_to_target) do |xcproj, target, url, requirement, products|
    begin
      _orig_add_spm.call(xcproj, target, url, requirement, products)
    rescue NoMethodError => e
      Pod::UI.warn "[SPMFix] Rescued NoMethodError in add_spm_to_target: #{e.message}"
    end
  end
end
`;

module.exports = function withSpmFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) {
        return config;
      }
      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (contents.includes('[SPMFix]')) {
        return config;
      }
      const marker = 'use_native_modules!';
      const idx = contents.lastIndexOf(marker);
      if (idx !== -1) {
        const eol = contents.indexOf('\n', idx + marker.length);
        const insertAt = eol !== -1 ? eol + 1 : contents.length;
        contents = contents.slice(0, insertAt) + SPM_PATCH + contents.slice(insertAt);
      } else {
        contents = contents + '\n' + SPM_PATCH;
      }
      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
