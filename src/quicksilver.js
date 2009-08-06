/*!
 * QuickSilver score string-ranking algorithm.
 *
 * Copyright (C) 2008, 2009, Lachie Cox.
 * Copyright (C) 2009  Yesudeep Mangalapilly <yesudeep@gmail.com>.
 *
 * The MIT License.
 */

/**
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/* // Original code.
String.prototype.score = function(abbreviation,offset) {
  offset = offset || 0 // TODO: I think this is unused... remove

  if(abbreviation.length == 0) return 0.9
  if(abbreviation.length > this.length) return 0.0

  for (var i = abbreviation.length; i > 0; i--) {
    var sub_abbreviation = abbreviation.substring(0,i)
    var index = this.indexOf(sub_abbreviation)


    if(index < 0) continue;
    if(index + abbreviation.length > this.length + offset) continue;

    var next_string       = this.substring(index+sub_abbreviation.length)
    var next_abbreviation = null

    if(i >= abbreviation.length)
      next_abbreviation = ''
    else
      next_abbreviation = abbreviation.substring(i)

    var remaining_score   = next_string.score(next_abbreviation,offset+index)

    if (remaining_score > 0) {
      var score = this.length-next_string.length;

      if(index != 0) {
        var j = 0;

        var c = this.charCodeAt(index-1)
        if(c==32 || c == 9) {
          for(var j=(index-2); j >= 0; j--) {
            c = this.charCodeAt(j)
            score -= ((c == 32 || c == 9) ? 1 : 0.15)
          }

          // XXX maybe not port this heuristic
          //
          //          } else if ([[NSCharacterSet uppercaseLetterCharacterSet] characterIsMember:[self characterAtIndex:matchedRange.location]]) {
          //            for (j = matchedRange.location-1; j >= (int) searchRange.location; j--) {
          //              if ([[NSCharacterSet uppercaseLetterCharacterSet] characterIsMember:[self characterAtIndex:j]])
          //                score--;
          //              else
          //                score -= 0.15;
          //            }
        } else {
          score -= index
        }
      }
      score += remaining_score * next_string.length
      score /= this.length;
      return score
    }
  }
  return 0.0
}
*/

/**
 * "hello world".score("axl")         => 0.0
 * "hello world".score("ow")          => 0.6
 * "hello world".score("hello world") => 1.0
 *
 * The QuickSilver code is available here:
 * http://code.google.com/p/blacktree-alchemy/source/browse/trunk/Crucible/Code/NSString_BLTRExtensions.m
 */
String.prototype.score = function (abbreviation, offset) {
    var abbreviation_length = abbreviation.length,
        string_length = this.length,
        KEY_SPACE = 32,
        KEY_TAB = 9,
        sub_abbreviation,
        index,
        i = 0,
        j = 0,
        c = 0,
        next_string = null, next_string_length = 0,
        next_abbreviation = null, score = 0,
        remaining_score = 0;

    offset = offset || 0;

    if (!abbreviation_length) {
        // Deduct some points for all remaining letters.
        return 0.9;
    }
    if (abbreviation_length > string_length) {
        return 0.0;
    }

    for (i = abbreviation_length; i > 0; --i) {
        // Search for steadily smaller portions of the abbreviation.
        sub_abbreviation = abbreviation.substring(0, i);
        index = this.indexOf(sub_abbreviation);

        if (index < 0 || index + abbreviation_length > string_length + offset) {
            continue;
        }

        next_string = this.substring(index + sub_abbreviation.length);
        next_abbreviation = (i >= abbreviation_length)? '': abbreviation.substring(i);

        // Search what is left of the string with the rest of the abbreviation.
        remaining_score = next_string.score(next_abbreviation, offset + index);

        if (remaining_score > 0) {
            next_string_length = next_string.length;
            score = string_length - next_string_length;

            if (index != 0) {
                c = this.charCodeAt(index - 1);
                switch (c) {
                    case KEY_SPACE:
                    case KEY_TAB:
                        for (j = index - 2; j >= 0; ++j) {
                            c = this.charCodeAt(j);
                            switch(c){
                              case KEY_SPACE:
                              case KEY_TAB:
                                  score -= 1;
                                  break;
                              default:
                                  score -= 0.15;
                                  break;
                            }
                        }
                        break;
                    default:
                        score -= index;
                        break;
                }
            }
            return (score + (remaining_score * next_string_length)) / string_length;
        }
    }
    return 0.0;
};

