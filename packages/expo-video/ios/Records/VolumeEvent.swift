// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

internal struct VolumeEvent: Record {
  @Field
  var volume: Float?

  @Field
  var isMuted: Bool?

  init() {}

  init(volume: Float? = nil, isMuted: Bool? = nil) {
    self.volume = volume
    self.isMuted = isMuted
  }
}
