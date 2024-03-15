// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

internal struct PlaybackError: Record {
  @Field
  var message: String?

  init() {}

  init(message: String?) {
    self.message = message
  }
}
