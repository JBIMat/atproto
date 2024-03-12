import express from 'express'
import * as plc from '@did-plc/lib'
import { IdResolver } from '@atproto/identity'
import AtpAgent from '@atproto/api'
import { Keypair } from '@atproto/crypto'
import { createServiceJwt } from '@atproto/xrpc-server'
import { ServerConfig } from './config'
import { DataPlaneClient } from './data-plane/client'
import { Hydrator } from './hydration/hydrator'
import { Views } from './views'
import { AuthVerifier } from './auth-verifier'
import { BsyncClient } from './bsync'
import { CourierClient } from './courier'
import {
  ParsedLabelers,
  defaultLabelerHeader,
  parseLabelerHeader,
} from './util'
import { httpLogger as log } from './logger'

export class AppContext {
  constructor(
    private opts: {
      cfg: ServerConfig
      dataplane: DataPlaneClient
      searchAgent: AtpAgent | undefined
      hydrator: Hydrator
      views: Views
      signingKey: Keypair
      idResolver: IdResolver
      bsyncClient: BsyncClient
      courierClient: CourierClient
      authVerifier: AuthVerifier
    },
  ) {}

  get cfg(): ServerConfig {
    return this.opts.cfg
  }

  get dataplane(): DataPlaneClient {
    return this.opts.dataplane
  }

  get searchAgent(): AtpAgent | undefined {
    return this.opts.searchAgent
  }

  get hydrator(): Hydrator {
    return this.opts.hydrator
  }

  get views(): Views {
    return this.opts.views
  }

  get signingKey(): Keypair {
    return this.opts.signingKey
  }

  get plcClient(): plc.Client {
    return new plc.Client(this.cfg.didPlcUrl)
  }

  get idResolver(): IdResolver {
    return this.opts.idResolver
  }

  get bsyncClient(): BsyncClient {
    return this.opts.bsyncClient
  }

  get courierClient(): CourierClient {
    return this.opts.courierClient
  }

  get authVerifier(): AuthVerifier {
    return this.opts.authVerifier
  }

  async serviceAuthJwt(aud: string) {
    const iss = this.cfg.serverDid
    return createServiceJwt({
      iss,
      aud,
      keypair: this.signingKey,
    })
  }

  reqLabelers(req: express.Request): ParsedLabelers {
    const val = req.header('atproto-accept-labelers')
    let parsed: ParsedLabelers | null
    try {
      parsed = parseLabelerHeader(val)
    } catch (err) {
      parsed = null
      log.info({ err, val }, 'failed to parse labeler header')
    }
    if (!parsed) return defaultLabelerHeader(this.cfg.labelsFromIssuerDids)
    return parsed
  }
}

export default AppContext
