// gmm_example.js
// Gaussian mixture clusteringscratch node.js JavaScript

// see:
// https://web.stanford.edu/~lmackey/stats306b/
//   doc/stats306b-spring14-lecture2_scribed.pdf

// GMM with full covariances

import * as math from "mathjs";

export class GMM {
  k: number;
  maxIter: number;
  N: number;
  dim: number;
  coefs: number[];
  means: number[][];
  covars: number[][][];
  probs: number[][];

  constructor(k: number, maxIter: number) {
    this.k = k;
    this.maxIter = maxIter;

    this.N = 0; // number data items
    this.dim = 0; // item dim

    this.coefs = GMM.vecMake(k, 1 / k);
    this.means = [];
    this.covars = [];
    this.probs = [];
  } // ctor()

  cluster(X: number[][]) {
    this.N = X.length;
    this.dim = X[0].length;

    // init means to k random data items
    this.means = GMM.matMake(this.k, this.dim);
    const idxs = this.select(this.N, this.k);
    for (let j = 0; j < this.k; ++j) {
      const idx = idxs[j];
      for (let d = 0; d < this.dim; ++d) this.means[j][d] = X[idx][d];
    }

    // init covars to (dim by dim) Identity matrices
    this.covars = GMM.mat3DMake(this.k, this.dim, this.dim);
    for (let j = 0; j < this.k; ++j) {
      // each component
      this.covars[j] = GMM.matIdentity(this.dim);
    }

    // instantiate this.probs
    this.probs = GMM.matMake(this.N, this.k, 0.0);
    for (let i = 0; i < this.N; ++i)
      for (let j = 0; j < this.k; ++j) this.probs[i][j] = 1.0 / this.k;

    // use EM meta-algorithm to compute this.probs
    for (let iter = 0; iter < this.maxIter; ++iter) {
      this.expectStep(X);
      this.maximStep(X);
    }
  } // cluster()

  predictProbs(X: number[][]) {
    const result = GMM.matMake(this.N, this.k, 0.0);
    for (let j = 0; j < this.k; ++j) {
      for (let i = 0; i < this.N; ++i) {
        result[i][j] =
          this.coefs[j] *
          GMM.matGaussianPdf(X[i], this.means[j], this.covars[j]); // this is the hard part
      }
    }

    // make each row sum to 1
    for (let i = 0; i < this.N; ++i) {
      let rowSum = 0.0;
      for (let j = 0; j < this.k; ++j) rowSum += result[i][j];
      for (let j = 0; j < this.k; ++j) result[i][j] /= rowSum;
    }

    return result;
  } // predictProbs()

  predictLabels(X: number[][]) {
    // mimics the scikit GaussianMixture.predict()
    const result = GMM.vecMake(this.N, 0.0);
    const probs = this.predictProbs(X); // Nxk
    for (let i = 0; i < this.N; ++i) {
      for (let j = 0; j < this.k; ++j) {
        const p = probs[i];
        const maxIdx = GMM.argMax(p);
        result[i] = maxIdx;
      }
    }
    return result;
  }

  expectStep(X: number[][]) {
    this.probs = this.predictProbs(X);
  }

  maximStep(X: number[][]) {
    // 0. compute new prob col sums needed to update
    const probSums = GMM.vecMake(this.k, 0.0);
    for (let i = 0; i < this.N; ++i)
      for (let j = 0; j < this.k; ++j) probSums[j] += this.probs[i][j];

    // 1. update mixture coefficients directly
    for (let j = 0; j < this.k; ++j) this.coefs[j] = probSums[j] / this.N;

    // 2. update means indiectly then copy into this.means
    // uj = S(i,n)[pij * xi] / S(i,n)[pij]
    const newMeans = GMM.matMake(this.k, this.dim, 0.0);
    for (let j = 0; j < this.k; ++j)
      for (let i = 0; i < this.N; ++i)
        for (let d = 0; d < this.dim; ++d)
          newMeans[j][d] += X[i][d] * this.probs[i][j];

    for (let j = 0; j < this.k; ++j)
      for (let d = 0; d < this.dim; ++d) newMeans[j][d] /= probSums[j];

    for (
      let row = 0;
      row < this.k;
      ++row // copy
    )
      for (let col = 0; col < this.dim; ++col)
        this.means[row][col] = newMeans[row][col];

    // 3. update covariances indirectly then copy
    // Cj = S(i,n)[pij * (xi-uj) * (xi-uj)T] / S(i,n)[pij]

    const newCovars = GMM.mat3DMake(this.k, this.dim, this.dim, 0.0);
    for (let j = 0; j < this.k; ++j) {
      const u = this.means[j]; // mean for this component
      for (let i = 0; i < this.N; ++i) {
        const x = X[i];
        const scale = this.probs[i][j];
        const tmp = GMM.vecVecScale(x, u, scale);
        // accumulate
        for (let row = 0; row < this.dim; ++row)
          for (let col = 0; col < this.dim; ++col)
            newCovars[j][row][col] += tmp[row][col];
      } // i

      // divide curr covar by prob_sums
      for (let row = 0; row < this.dim; ++row)
        for (let col = 0; col < this.dim; ++col)
          newCovars[j][row][col] /= probSums[j];

      // condition the diagonal
      for (let row = 0; row < this.dim; ++row) newCovars[j][row][row] += 1.0e-6;
    } // j

    // copy indirect result into this.covars
    for (let j = 0; j < this.k; ++j)
      for (let row = 0; row < this.dim; ++row)
        for (let col = 0; col < this.dim; ++col)
          this.covars[j][row][col] = newCovars[j][row][col];
  } // maximStep()

  select(N: number, n: number): number[] {
    const indices = Array.from({ length: N }, (_, i) => i);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, n);
  }

  // --------------------------------------------------------
  // static helper methods
  // --------------------------------------------------------

  static matMake(rows: number, cols: number, val?: number) {
    return new Array(rows).fill(0).map(() => new Array(cols).fill(val ?? 0));
  }

  static mat3DMake(factors: number, rows: number, cols: number, val?: number) {
    // used to init this.covars
    return new Array(factors).fill(0).map(() => GMM.matMake(rows, cols, val));
  }

  static vecMake(n: number, val?: number) {
    return new Array(n).fill(val ?? 0);
  }

  static matGaussianPdf(x: number[], u: number[], covar: number[][]) {
    // PDF(x) of Gaussian with mean u, covariance covar
    const X = GMM.vecToMat(x, x.length, 1);
    const U = GMM.vecToMat(u, u.length, 1);

    const k = x.length; // dim
    const a = GMM.matTranspose(GMM.matDiff(X, U));
    const L = GMM.matCholeskyDecomp(covar);
    const b = GMM.matCholeskyInverse(L);
    const c = GMM.matDiff(X, U);
    const d = GMM.matProduct(a, b);
    const e = GMM.matProduct(d, c);
    const numer = Math.exp(-0.5 * e[0][0]);
    const f = Math.pow(2 * Math.PI, k);
    const g = GMM.matCholeskyDeterminant(L);
    const denom = Math.sqrt(f * g);
    const pdf = numer / denom;
    return pdf;
  }

  static vecToMat(vec: number[], rows: number, cols: number) {
    const result = GMM.matMake(rows, cols, 0.0);
    let k = 0;
    for (let i = 0; i < rows; ++i)
      for (let j = 0; j < cols; ++j) result[i][j] = vec[k++];
    return result;
  }

  static vecVecScale(x: number[], u: number[], scale: number) {
    // helper for maximization step
    // (x-u) * (x-u)T * scale
    const n = u.length;
    const xMinusU = math.subtract(x, u);

    const result = GMM.matMake(n, n, 0.0);
    for (let i = 0; i < n; ++i)
      for (let j = 0; j < n; ++j)
        result[i][j] = xMinusU[i] * xMinusU[j] * scale;
    return result;
  }

  static matTranspose(m: number[][]) {
    return math.transpose(m);
  }

  static matDiff(matA: number[][], matB: number[][]) {
    return math.subtract(matA, matB);
  }

  static matProduct(ma: number[][], mb: number[][]) {
    return math.multiply(ma, mb);
  }

  static matIdentity(n: number) {
    const result = GMM.matMake(n, n, 0.0);
    for (let i = 0; i < n; ++i) result[i][i] = 1.0;
    return result;
  }

  static matCholeskyDecomp(m: number[][]) {
    // Cholesky decomposition
    // m is square, symmetric, positive definite
    const n = m.length;
    const result = GMM.matMake(n, n, 0.0);
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j <= i; ++j) {
        let sum = 0.0;
        for (let k = 0; k < j; ++k) sum += result[i][k] * result[j][k];
        if (i == j) {
          const tmp = m[i][i] - sum;
          if (tmp < 0.0) throw "matCholeskyDecomp fatal error ";
          result[i][j] = Math.sqrt(tmp);
        } else {
          if (result[j][j] == 0.0) throw "matCholeskyDecomp fatal error ";
          result[i][j] = (1.0 / result[j][j]) * (m[i][j] - sum);
        }
      } // j
    } // i

    return result;
  } // matCholeskyDecomp()

  static matCholeskyInverse(L: number[][]) {
    // L is the Cholesky decomp of source matrix
    const n = L.length;
    const result = GMM.matIdentity(n);

    for (let k = 0; k < n; ++k) {
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < k; i++) {
          result[k][j] -= result[i][j] * L[k][i];
        }
        result[k][j] /= L[k][k];
      }
    }

    for (let k = n - 1; k >= 0; --k) {
      for (let j = 0; j < n; j++) {
        for (let i = k + 1; i < n; i++) {
          result[k][j] -= result[i][j] * L[i][k];
        }
        result[k][j] /= L[k][k];
      }
    }
    return result;
  }

  static matCholeskyDeterminant(L: number[][]) {
    // product of squared diag elements of L
    let result = 1.0;
    const n = L.length;
    for (let i = 0; i < n; ++i) result *= L[i][i] * L[i][i];
    return result;
  }

  static argMax(vec: number[]) {
    // helper for PredictLabels()
    const n = vec.length;
    let maxVal = vec[0];
    let maxIdx = 0;
    for (let i = 0; i < n; ++i) {
      if (vec[i] > maxVal) {
        maxVal = vec[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  }
}
